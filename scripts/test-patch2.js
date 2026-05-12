const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';

async function testAllFields() {
  // Get article id
  const list = await fetch(SUPABASE_URL + '/rest/v1/articles?select=id,slug&limit=1', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const articles = await list.json();
  const id = articles[0].id;
  
  console.log('Testing with article id:', id);
  
  // Test 1: PATCH with all fields together
  const blocks = [{type:'paragraph',content:'Updated via PATCH with all fields'}];
  
  const patch = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': 'Bearer ' + ANON_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      content: JSON.stringify(blocks),
      title: 'UPDATED_TITLE_' + Date.now(),
      read_time: 99
    })
  });
  console.log('PATCH all fields status:', patch.status);
  const d = await patch.json();
  console.log('PATCH returned:', d.length, 'rows');
  
  // Check
  const v = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id + '&select=title,content,read_time', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const vd = await v.json();
  console.log('title:', vd[0]?.title);
  console.log('read_time:', vd[0]?.read_time);
  console.log('content[:30]:', (vd[0]?.content || '').slice(0,30));
  console.log('isJSON:', (vd[0]?.content || '').startsWith('['));
}

testAllFields().catch(e => console.error(e));