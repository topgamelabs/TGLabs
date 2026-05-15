const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test() {
  // Get article id
  const list = await fetch(SUPABASE_URL + '/rest/v1/articles?select=id,slug&limit=1', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const articles = await list.json();
  const id = articles[0].id;
  
  console.log('Testing with article id:', id);
  
  // Test PATCH with content field using id=eq filter
  const blocks = [{type:'paragraph',content:'Testing content update via id filter'}];
  
  const patch = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': 'Bearer ' + ANON_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({content: JSON.stringify(blocks)})
  });
  console.log('PATCH by id status:', patch.status);
  const d = await patch.json();
  console.log('PATCH returned:', JSON.stringify(d).slice(0,100));
  
  // Now check
  const v = await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + id + '&select=content', {
    headers: {apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY}
  });
  const vd = await v.json();
  console.log('content[:50]:', (vd[0]?.content || '').slice(0,50));
  console.log('isJSON:', (vd[0]?.content || '').startsWith('['));
}

test().catch(e => console.error(e));
