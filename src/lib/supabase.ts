import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pegajhvjrldsdzfyppcv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';

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
export async function getArticles({ limit = 10 } = {}) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?select=*&order=created_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  console.log("ARTICLES:", data);

  // 🔥 FIX สำคัญ
  if (!Array.isArray(data)) {
    console.error("GET ARTICLES ERROR:", data);
    return [];
  }

  return data;
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
