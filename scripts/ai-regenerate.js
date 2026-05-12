/**
 * AI-Powered Content Regeneration
 * 
 * Fetches HTML from production → parses with AI → regenerates clean JSON blocks
 * Then updates Supabase with fresh data
 * 
 * Usage: 
 *   SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... node scripts/ai-regenerate.js
 */

const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PRODUCTION_URL = 'https://tglabs.info';

// All bad article slugs
const BAD_SLUGS = [
  'rov-attack-on-titan-collaboration',
  'seven-knights-re-birth-เปิดตัวอย่างเป็นทางการ',
  'verify-patch-test-1778315440',
  'test-json-blocks-$(date +%s)',
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

function extractArticleText(html) {
  // Extract main article content
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) return html;
  
  let articleHtml = articleMatch[1];
  
  // Remove ads, nav, footer, sidebar
  articleHtml = articleHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*advertisement[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<button[\s\S]*?<\/button>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
    
  return articleHtml;
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
      // Flush list buffer first
      if (listBuffer.length > 0) {
        const key = 'bullet:' + listBuffer.join('|');
        if (!seen.has(key)) {
          seen.add(key);
          blocks.push({ type: 'bullet', items: [...listBuffer] });
        }
        listBuffer = [];
      }
      
      const key = tag + ':' + text.slice(0, 30);
      if (!seen.has(key)) {
        seen.add(key);
        
        if (tag === 'p') {
          blocks.push({ type: 'paragraph', content: text });
        } else if (tag.match(/^h[1-6]$/)) {
          blocks.push({ type: 'heading', level: parseInt(tag[1]), content: text });
        } else if (tag === 'blockquote') {
          blocks.push({ type: 'quote', content: text });
        }
      }
    }
  }
  
  // Flush remaining list
  if (listBuffer.length > 0) {
    blocks.push({ type: 'bullet', items: [...listBuffer] });
  }
  
  // Extract hr elements as rule blocks
  const hrRegex = /<hr\s*\/?>/gi;
  while ((match = hrRegex.exec(html)) !== null) {
    blocks.push({ type: 'rule' });
  }
  
  return blocks;
}

async function regenerateWithAI(slug, cleanText) {
  if (!OPENAI_API_KEY) {
    console.log('  → Using HTML parser (no OpenAI key)');
    return extractBlocksFromHtml(cleanText);
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content parser. Given the article text, extract structured JSON blocks.
Return a JSON array of blocks. Each block should be one of:
- {type:"paragraph", content:"text"}
- {type:"heading", level:1|2|3, content:"text"}  
- {type:"bullet", items:["item1","item2"]}
- {type:"quote", content:"text"}
- {type:"rule"}

Rules:
- Paragraphs should be substantial (not short phrases)
- Bullets should have multiple items grouped together
- Output ONLY the JSON array, no markdown code blocks or explanation`
          },
          {
            role: 'user',
            content: `Extract structured content from this article:\n\n${cleanText.slice(0, 8000)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return extractBlocksFromHtml(cleanText);
    
    let parsed;
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(cleaned);
    } catch {
      return extractBlocksFromHtml(cleanText);
    }
    
    return parsed;
  } catch (e) {
    console.log('  → AI error, using HTML parser:', e.message);
    return extractBlocksFromHtml(cleanText);
  }
}

async function getArticleBySlug(slug) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&select=id,slug,title,content`, {
    headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
  });
  const data = await res.json();
  return data[0] || null;
}

async function updateSupabase(id, blocks) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ content: JSON.stringify(blocks) }),
  });
  return res.ok;
}

async function main() {
  console.log('🔄 AI-Powered Content Regeneration\n');
  console.log('Production:', PRODUCTION_URL);
  console.log('OpenAI:', OPENAI_API_KEY ? 'YES' : 'NO');
  console.log('');
  
  let total = 0;
  let success = 0;
  let failed = 0;
  
  for (const slug of BAD_SLUGS) {
    console.log(`\n📰 ${slug}`);
    total++;
    
    const article = await getArticleBySlug(slug);
    if (!article) {
      console.log('  ❌ Not found in Supabase');
      failed++;
      continue;
    }
    
    // Fetch HTML from production
    let html;
    try {
      const res = await fetch(`${PRODUCTION_URL}/news/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (e) {
      console.log('  ❌ Cannot fetch from production:', e.message);
      failed++;
      continue;
    }
    
    const articleHtml = extractArticleText(html);
    const cleanText = extractCleanText(articleHtml);
    
    console.log('  📄 Extracted', cleanText.length, 'chars');
    
    if (cleanText.length < 30) {
      console.log('  ⚠️  Too little text - skipping');
      failed++;
      continue;
    }
    
    const blocks = await regenerateWithAI(slug, articleHtml);
    
    if (!blocks || blocks.length === 0) {
      console.log('  ❌ No blocks generated');
      failed++;
      continue;
    }
    
    console.log('  📦', blocks.length, 'blocks');
    blocks.slice(0, 4).forEach((b, i) => {
      if (b.type === 'paragraph') console.log('    [' + i + '] p: ' + b.content.slice(0, 50));
      else if (b.type === 'heading') console.log('    [' + i + '] h' + b.level + ': ' + b.content.slice(0, 50));
      else if (b.type === 'bullet') console.log('    [' + i + '] bullet: ' + b.items.length + ' items');
      else if (b.type === 'quote') console.log('    [' + i + '] quote: ' + b.content.slice(0, 50));
      else console.log('    [' + i + ']', b.type);
    });
    
    const ok = await updateSupabase(article.id, blocks);
    if (ok) {
      success++;
      console.log('  ✅ Updated');
    } else {
      failed++;
      console.log('  ❌ Update failed');
    }
  }
  
  console.log(`\n📊 Total: ${total} | Success: ${success} | Failed: ${failed}`);
  if (success > 0) console.log('\n✅ Done!');
}

main().catch(console.error);
