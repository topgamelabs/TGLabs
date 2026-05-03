import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?select=slug,updated_at,is_published`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "force-cache",
      next: { revalidate: 300 },
    }
  );

  const articles = await res.json();

  const baseUrl = "https://tglabs.info";

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
    },
  ];

  const articleUrls = articles
    .filter((a: any) => a.is_published) // 🔥 สำคัญ
    .map((a: any) => ({
      url: `${baseUrl}/news/${a.slug}`,
      lastModified: new Date(a.updated_at || Date.now()),
    }));

  return [...staticUrls, ...articleUrls];
}