import { MetadataRoute } from "next";

const SUPABASE_REST_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pegajhvjrldsdzfyppcv.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(
    `${SUPABASE_REST_URL}/rest/v1/articles?select=slug,updated_at,is_published`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY!,
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