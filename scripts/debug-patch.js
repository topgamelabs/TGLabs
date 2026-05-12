const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';

async function main() {
  // Get article
  const list = await fetch(SUPABASE_URL + '/rest/v1/articles?select=id,slug&limit=1', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const articles = await list.json();
  const id = articles[0].id;
  const slug = articles[0].slug;
  console.log('Article:', slug, 'id:', id);

  // Current state
  const state = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id + '&select=title,content,read_time', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const s = await state.json();
  console.log('BEFORE - title:', s[0].title, 'read_time:', s[0].read_time, 'content[:40]:', s[0].content.slice(0,40));

  // Try PATCH with read_time
  const p1 = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Prefer': 'return=representation'},
    body: JSON.stringify({read_time: 555})
  });
  console.log('PATCH read_time - status:', p1.status, 'returned:', (await p1.json()).length, 'rows');

  // Check
  const c1 = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id + '&select=read_time', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const r1 = await c1.json();
  console.log('AFTER read_time:', r1[0].read_time);
}

main().catch(e => console.error(e));
