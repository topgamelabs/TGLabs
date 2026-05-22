const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function check() {
  // Get a few sample articles
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles?is_published=eq.true&select=id,slug,content&limit=3', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const d = await res.json();
  
  for (const article of d) {
    console.log('=== ' + article.slug + ' ===');
    console.log('Length:', article.content.length);
    console.log('First 200 chars:', article.content.slice(0, 200));
    try {
      const parsed = JSON.parse(article.content);
      console.log('Parsed blocks:', parsed.length);
      parsed.forEach((b, i) => console.log('  block[' + i + ']:', JSON.stringify(b).slice(0, 80)));
    } catch {
      console.log('Not JSON - might be partial HTML:', article.content.slice(0, 100));
    }
    console.log('');
  }
}

check().catch(e => console.error(e));
