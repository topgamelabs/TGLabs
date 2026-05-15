const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function check() {
  // Check total HTML vs JSON articles
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles?is_published=eq.true&select=id,content', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const all = await res.json();
  const htmlCount = all.filter(a => a.content && !a.content.trim().startsWith('[')).length;
  console.log('Total:', all.length, '| HTML still:', htmlCount, '| JSON migrated:', all.length - htmlCount);
  
  // Show first HTML article (should be none if migration worked)
  if (htmlCount > 0) {
    const htmlArticle = all.find(a => a.content && !a.content.trim().startsWith('['));
    console.log('First HTML:', htmlArticle.id, htmlArticle.content.slice(0, 60));
  }
  
  // Show a JSON article sample
  const jsonArticle = all.find(a => a.content && a.content.trim().startsWith('['));
  if (jsonArticle) {
    const parsed = JSON.parse(jsonArticle.content);
    console.log('Sample JSON blocks:', parsed.length, 'blocks');
    console.log('First block:', JSON.stringify(parsed[0]));
  }
}

check().catch(e => console.error(e));
