const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';
const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';

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