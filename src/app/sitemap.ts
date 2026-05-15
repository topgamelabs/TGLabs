import { MetadataRoute } from "next";
import { getPublicSupabaseConfig } from "@/lib/env";

type SitemapArticle = {
  slug: string;
  updated_at?: string | null;
};

const { url: SUPABASE_REST_URL, anonKey: SUPABASE_ANON_KEY } =
  getPublicSupabaseConfig();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch(
    `${SUPABASE_REST_URL}/rest/v1/articles?is_published=eq.true&select=slug,updated_at`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
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

  const articleUrls = (Array.isArray(articles) ? articles : []).map(
    (article: SitemapArticle) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: new Date(article.updated_at || Date.now()),
    })
  );

  return [...staticUrls, ...articleUrls];
}
