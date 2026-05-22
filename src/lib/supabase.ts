import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from "@/lib/env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getPublicSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Game {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  platform: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  game_id: string | null;
  hero_image: string | null;
  hero_caption: string | null;
  inline_images: InlineImage[] | null;
  author_id: string;
  read_time: number;
  rating: number | null;
  view_count: number;
  is_published: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  games?: Game | null;
  author_name?: string;
}

export interface InlineImage {
  url: string;
  caption?: string;
  position?: number; // paragraph index to insert after
}

export type ArticleCategoryCounts = Record<string, number>;

// Fetch all games
export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

// Fetch published articles with optional filters
const SUPABASE_REST_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseAnonKey;

export async function getArticles({ limit = 10, category }: { limit?: number; category?: string } = {}) {
  const categoryQuery = category ? `&category=eq.${encodeURIComponent(category)}` : "";
  const res = await fetch(
    `${SUPABASE_REST_URL}/rest/v1/articles?select=*&is_published=eq.true${categoryQuery}&order=created_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY!,
      },
      next: { revalidate: 60 }, // ✅ cache 60s — SEO friendly
    }
  );


  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error("[getArticles] ERROR: unexpected response", data);
    return [];
  }

  return data;
}

export async function getArticleCategoryCounts(
  categories: string[] = ["gaming", "news", "mobile", "pc-console", "review", "tips", "tech", "tournament"]
): Promise<ArticleCategoryCounts> {
  const emptyCounts = Object.fromEntries(categories.map((category) => [category, 0]));

  try {
    const totalQuery = supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);

    const [totalResult, entries] = await Promise.all([
      totalQuery,
      Promise.all(
        categories.map(async (category) => {
          const { count, error } = await supabase
            .from("articles")
            .select("id", { count: "exact", head: true })
            .eq("is_published", true)
            .eq("category", category);

          if (error) return [category, 0] as const;
          return [category, count || 0] as const;
        })
      ),
    ]);

    if (totalResult.error) {
      return {
        all: 0,
        ...emptyCounts,
      };
    }

    return {
      all: totalResult.count || 0,
      ...Object.fromEntries(entries),
    };
  } catch {
    return {
      all: 0,
      ...emptyCounts,
    };
  }
}

// Fetch single article by slug
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      games:game_id (*)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) return null;
  return data;
}

// Increment view count
export async function incrementView(articleId: string): Promise<void> {
  await supabase.rpc('increment_view', { article_uuid: articleId });
}

// Search articles
export async function searchArticles(query: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      games:game_id (*)
    `)
    .textSearch('search_vector', query, { config: 'thai' })
    .eq('is_published', true)
    .limit(10);

  if (error) throw error;
  return data || [];
}
