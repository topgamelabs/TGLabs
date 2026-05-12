const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';

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
