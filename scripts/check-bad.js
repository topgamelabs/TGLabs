const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getAllArticles() {
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/articles?is_published=eq.true&select=id,slug,content&limit=50',
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: 'Bearer ' + ANON_KEY,
      },
    }
  );
  return res.json();
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBadMigration(content) {
  if (!content || typeof content !== 'string') return false;
  if (!content.trim().startsWith('[')) return false;
  try {
    const parsed = JSON.parse(content);
    if (parsed.length === 1 && parsed[0]?.type === 'paragraph') {
      const text = parsed[0].content || '';
      // Bad if: single short paragraph, or looks like HTML tag name
      if (text.length < 50 || text.match(/^(h[1-6]|p|div|ul|li|blockquote)$/i)) {
        return true;
      }
    }
    if (content.includes('<p>') || content.includes('<h') || content.includes('<ul')) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

async function main() {
  console.log('🔍 ค้นหา bad migrations...\n');
  
  const articles = await getAllArticles();
  console.log('Total articles fetched:', articles.length);
  
  const badOnes = articles.filter(a => isBadMigration(a.content));
  
  if (badOnes.length === 0) {
    console.log('✅ ไม่พบ articles ที่ต้อง re-migrate');
    return;
  }
  
  console.log(`\n⚠️  พบ ${badOnes.length} bad migrations:`);
  for (const a of badOnes) {
    try {
      const p = JSON.parse(a.content);
      console.log(' -', a.slug, '->', JSON.stringify(p[0]).slice(0, 60));
    } catch {
      console.log(' -', a.slug, '-> cannot parse');
    }
  }
}

main().catch(e => console.error(e));
