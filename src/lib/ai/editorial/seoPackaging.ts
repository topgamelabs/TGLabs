import type { EditorialNewsItem, SeoPackage } from "./types"

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 90)
    .replace(/^-+|-+$/g, "")
}

export function packageSeoResult(
  item: EditorialNewsItem,
  article: {
    title: string
    slug?: string
    excerpt: string
    seo_title?: string
    seo_description?: string
    category?: string
  },
  qualityScore = 70
): SeoPackage {
  const slug = normalizeSlug(article.slug || article.seo_title || article.title || item.title)

  return {
    title: article.title,
    slug: slug || "news",
    excerpt: article.excerpt,
    meta_title: article.seo_title || article.title,
    meta_description: article.seo_description || article.excerpt,
    category: article.category || "gaming",
    tags: ["game-news", article.category || "gaming", item.source].filter(Boolean),
    quality_score: Math.min(100, Math.max(0, Math.round(qualityScore))),
  }
}
