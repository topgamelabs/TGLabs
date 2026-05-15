const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles?is_published=eq.true&select=id,slug,content&limit=30', {
    headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
  });
  const d = await res.json();
  console.log('Type:', typeof d, 'IsArray:', Array.isArray(d));
  if (!Array.isArray(d)) {
    console.log('Error response:', JSON.stringify(d).slice(0, 200));
    return;
  }
  console.log('Total:', d.length);
  d.forEach(a => {
    try {
      const p = JSON.parse(a.content);
      console.log(' [' + p.length + '] ' + a.slug.slice(0, 50));
    } catch {
      console.log(' [ERR:bad json] ' + a.slug.slice(0, 50));
    }
  });
}

main().catch(e => console.error(e));
