/**
 * Full Content Regeneration Script - with verbose logging
 */

const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDU2NSwiZXhwIjoyMDkwODAwNTY1fQ.vwYsQF5V9TnOU9bRTpkJjXZ9CXX-tQE8V8yLqpzlmMQ';
const PRODUCTION_URL = 'http://localhost:3000';

const BAD_SLUGS = [
  'rov-attack-on-titan-collaboration',
  'seven-knights-re-birth-เปิดตัวอย่างเป็นทางการ',
  'verify-patch-test-1778315440',
  'test-json-blocks-test',
  'test-insert-json-1778315227972',
];

function extractCleanText(html) {
  return html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function extractBlocksFromHtml(html) {
  const blocks = [];
  const seen = new Set();
  const blockRegex = /<(p|h[1-6]|li|blockquote)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match;
  let listBuffer = [];

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const text = extractCleanText(content);
    if (!text || text.length < 3) continue;

    if (tag === 'li') {
      listBuffer.push(text);
    } else {
      if (listBuffer.length > 0) {
        blocks.push({ type: 'bullet', items: [].concat(listBuffer) });
        listBuffer = [];
      }
      const key = tag + ':' + text.slice(0, 30);
      if (!seen.has(key)) {
        seen.add(key);
        if (tag === 'p') blocks.push({ type: 'paragraph', content: text });
        else if (tag.match(/^h[1-6]$/)) blocks.push({ type: 'heading', level: parseInt(tag[1]), content: text });
        else if (tag === 'blockquote') blocks.push({ type: 'quote', content: text });
      }
    }
  }
  if (listBuffer.length > 0) blocks.push({ type: 'bullet', items: [].concat(listBuffer) });
  return blocks;
}

async function getArticleBySlug(slug) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles?slug=eq.' + encodeURIComponent(slug) + '&select=id,slug', {
    headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
  });
  return res.json().then(d => d[0] || null);
}

async function updateSupabase(id, blocks) {
  const jsonContent = JSON.stringify(blocks);
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ content: jsonContent }),
  });
  console.log('  PATCH status:', res.status, 'OK:', res.ok);
  if (!res.ok) {
    const text = await res.text();
    console.log('  PATCH error:', text);
  }
  return res.ok;
}

async function main() {
  console.log('Starting regeneration...\n');
  let success = 0, failed = 0;

  for (const slug of BAD_SLUGS) {
    console.log('\n' + slug);
    const article = await getArticleBySlug(slug);
    if (!article) { console.log('  Not found'); failed++; continue; }
    console.log('  Article ID:', article.id);

    let html;
    try {
      const res = await fetch(PRODUCTION_URL + '/news/' + encodeURIComponent(slug));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      html = await res.text();
    } catch (e) { console.log('  Fetch failed:', e.message); failed++; continue; }

    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const articleHtml = articleMatch ? articleMatch[1] : html;
    const cleanText = extractCleanText(articleHtml);
    console.log('  Text chars:', cleanText.length);

    if (cleanText.length < 10) { console.log('  Too little text'); failed++; continue; }

    const blocks = extractBlocksFromHtml(articleHtml);
    console.log('  Blocks:', blocks.length);
    blocks.slice(0, 3).forEach((b, i) => {
      if (b.type === 'paragraph') console.log('    [' + i + '] p: ' + b.content.slice(0, 50));
      else if (b.type === 'heading') console.log('    [' + i + '] h' + b.level + ': ' + b.content.slice(0, 50));
      else if (b.type === 'bullet') console.log('    [' + i + '] bullet: ' + b.items.length + ' items');
      else console.log('    [' + i + ']', b.type);
    });

    const ok = await updateSupabase(article.id, blocks);
    if (ok) { success++; console.log('  OK'); }
    else { failed++; console.log('  FAILED'); }
  }

  console.log('\nDone:', success, 'success,', failed, 'failed');
}

main().catch(console.error);
