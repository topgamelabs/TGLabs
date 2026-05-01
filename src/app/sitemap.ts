export default async function sitemap() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?select=slug`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    }
  );

  const articles = await res.json();

  return [
    {
      url: "https://tglabs.info",
      lastModified: new Date(),
    },
    {
      url: "https://tglabs.info/news",
      lastModified: new Date(),
    },
    ...articles.map((a: any) => ({
      url: `https://tglabs.info/news/${a.slug}`,
      lastModified: new Date(),
    })),
  ];
}