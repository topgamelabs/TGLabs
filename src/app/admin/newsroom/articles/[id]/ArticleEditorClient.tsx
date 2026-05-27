"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import {
  ContentRenderer,
  type ContentBlock,
} from "@/components/news/ContentRenderer"

type ArticleForm = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  hero_image: string
  status: string
  is_published: boolean
  seo_title: string
  seo_description: string
  source_url: string | null
  published_at: string | null
  facebook_post_id: string | null
  facebook_posted_at: string | null
  facebook_first_comment_id: string | null
  facebook_post_error: string | null
  facebook_last_attempt_at: string | null
}

function qualityChecks(article: ArticleForm | null) {
  if (!article) return []
  let text = article.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  let isValidBlocks = false

  try {
    const parsed = JSON.parse(article.content)
    const blocks = Array.isArray(parsed) ? parsed : []
    text = blocks
      .flatMap((block: { content?: string; items?: string[]; tagLabel?: string; label?: string }) =>
        block.items || [block.content || block.tagLabel || block.label || ""]
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    isValidBlocks = blocks.length > 0
  } catch {
    isValidBlocks = false
  }

  return [
    { label: "Title", ok: article.title.trim().length > 10 },
    { label: "Slug", ok: /^[a-z0-9-]+$/.test(article.slug) },
    { label: "Excerpt", ok: article.excerpt.trim().length > 40 },
    { label: "Content 800+ chars", ok: text.length >= 800 },
    { label: "JSON blocks", ok: isValidBlocks || article.content.trim().startsWith("<") },
    { label: "SEO description", ok: article.seo_description.trim().length > 60 },
  ]
}

function parseJsonBlocks(content: string): {
  blocks: ContentBlock[]
  error: string | null
} {
  const trimmed = content.trim()
  if (!trimmed) return { blocks: [], error: "Content is empty" }

  try {
    const parsed = JSON.parse(trimmed)
    const blocks = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray(parsed.blocks)
        ? parsed.blocks
        : null

    if (!blocks) {
      return { blocks: [], error: "Content is JSON, but not a blocks array" }
    }

    return { blocks: blocks as ContentBlock[], error: null }
  } catch {
    return { blocks: [], error: "Content is not valid JSON Blocks" }
  }
}

export function ArticleEditorClient({ id }: { id: string }) {
  const [article, setArticle] = useState<ArticleForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [postingFacebook, setPostingFacebook] = useState(false)
  const [message, setMessage] = useState("")
  const [contentMode, setContentMode] = useState<"preview" | "raw">("preview")

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setArticle({
            ...json.article,
            excerpt: json.article.excerpt || "",
            content: json.article.content || "",
            category: json.article.category || "gaming",
            hero_image: json.article.hero_image || "",
            seo_title: json.article.seo_title || "",
            seo_description: json.article.seo_description || "",
            facebook_post_id: json.article.facebook_post_id || null,
            facebook_posted_at: json.article.facebook_posted_at || null,
            facebook_first_comment_id: json.article.facebook_first_comment_id || null,
            facebook_post_error: json.article.facebook_post_error || null,
            facebook_last_attempt_at: json.article.facebook_last_attempt_at || null,
          })
        }
      })
  }, [id])

  function update<K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) {
    if (!article) return
    setArticle({ ...article, [key]: value })
  }

  async function save(nextPublished = article?.is_published) {
    if (!article) return
    const nextArticle = {
      ...article,
      is_published: Boolean(nextPublished),
      status: nextPublished ? "published" : "draft",
      published_at: nextPublished
        ? article.published_at || new Date().toISOString()
        : null,
    }
    setSaving(true)
    setMessage("")
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextArticle),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      setArticle(nextArticle)
      setMessage(nextArticle.is_published ? "Published" : "Saved as draft")
    } else {
      setMessage(json.error || "Save failed")
    }
  }

  async function postToFacebook() {
    if (!article || postingFacebook) return

    if (!article.is_published) {
      setMessage("Publish the article before posting to Facebook")
      return
    }

    if (article.facebook_post_id) {
      setMessage("This article already has a Facebook post")
      return
    }

    if (!article.hero_image) {
      setMessage("Hero image is required for Facebook photo post")
      return
    }

    if (!confirm("Post this published article to Facebook now?")) return

    setPostingFacebook(true)
    setMessage("")

    const res = await fetch("/api/facebook/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "photo",
        articleId: article.id,
      }),
    })
    const json = await res.json().catch(() => null)
    setPostingFacebook(false)

    if (!json?.success) {
      const error = json?.error || "Facebook post failed"
      setArticle({
        ...article,
        facebook_post_error: error,
        facebook_last_attempt_at: new Date().toISOString(),
      })
      setMessage(error)
      return
    }

    const nextArticle = {
      ...article,
      facebook_post_id:
        json.facebookPhotoPost?.post_id || json.facebookPhotoPost?.id || null,
      facebook_first_comment_id: json.facebookComment?.id || null,
      facebook_posted_at: new Date().toISOString(),
      facebook_post_error: json.commentError || null,
      facebook_last_attempt_at: new Date().toISOString(),
    }
    setArticle(nextArticle)
    setMessage(
      json.warning
        ? "Facebook photo posted, but first comment failed"
        : "Posted to Facebook"
    )
  }

  const checks = qualityChecks(article)
  const blockPreview = article
    ? parseJsonBlocks(article.content)
    : { blocks: [], error: null }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E8E8E8]">
      <header className="border-b border-white/[0.06] bg-black/80 px-5 py-5">
        <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-4">
          <div>
            <Link href="/admin/newsroom" className="text-xs uppercase tracking-[1.6px] text-white/40 hover:text-white/70">
              Back to Newsroom
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-white">Edit Article</h1>
          </div>
          <button onClick={() => save()} disabled={saving || !article} className="h-10 rounded-md bg-[#FF1A1A] px-5 text-sm font-semibold text-white disabled:opacity-40">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <main className="max-w-[1180px] mx-auto px-5 py-6">
        {!article ? (
          <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-8 text-white/50">
            Loading article...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <section className="space-y-4">
              <input value={article.title} onChange={(e) => update("title", e.target.value)} className="w-full rounded-md border border-white/[0.08] bg-[#0D0D0D] px-4 py-3 text-xl font-semibold text-white outline-none focus:border-[#FF1A1A]/50" />
              <input value={article.slug} onChange={(e) => update("slug", e.target.value)} className="w-full rounded-md border border-white/[0.08] bg-[#0D0D0D] px-4 py-3 text-sm text-white/80 outline-none focus:border-[#FF1A1A]/50" />
              <textarea value={article.excerpt} onChange={(e) => update("excerpt", e.target.value)} rows={3} className="w-full rounded-md border border-white/[0.08] bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none focus:border-[#FF1A1A]/50" />

              <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0D0D0D]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Content</h2>
                    <p className="mt-1 text-xs text-white/40">
                      Preview uses the same JSON Blocks renderer as the public article page.
                    </p>
                  </div>
                  <div className="flex rounded-md border border-white/[0.08] bg-[#050505] p-1">
                    {(["preview", "raw"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setContentMode(mode)}
                        className={`h-8 rounded px-3 text-xs font-medium capitalize transition-colors ${
                          contentMode === mode
                            ? "bg-[#FF1A1A] text-white"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {contentMode === "preview" ? (
                  <div className="min-h-[520px] bg-[#080808] px-5 py-6">
                    {blockPreview.error ? (
                      <div className="rounded-md border border-[#FF6B35]/25 bg-[#FF6B35]/10 px-4 py-3 text-sm text-[#FFB08F]">
                        {blockPreview.error}
                      </div>
                    ) : (
                      <article className="mx-auto max-w-[760px]">
                        <ContentRenderer blocks={blockPreview.blocks} />
                      </article>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={article.content}
                    onChange={(e) => update("content", e.target.value)}
                    rows={22}
                    className="min-h-[520px] w-full resize-y border-0 bg-[#080808] px-4 py-3 font-mono text-sm leading-6 text-white outline-none"
                  />
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
                <h2 className="text-sm font-semibold text-white">Publishing</h2>
                <div className="mt-4 rounded-md border border-white/[0.08] bg-[#050505] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[1.4px] text-white/35">Current status</p>
                  <p className={article.is_published ? "mt-1 text-sm font-semibold text-[#4DCC8A]" : "mt-1 text-sm font-semibold text-white/60"}>
                    {article.is_published ? "Published" : "Draft"}
                  </p>
                </div>
                <select value={article.category} onChange={(e) => update("category", e.target.value)} className="mt-4 h-10 w-full rounded-md border border-white/[0.08] bg-[#050505] px-3 text-sm text-white">
                  {["gaming", "mobile", "pc-console", "review", "tips", "tech", "tournament", "live", "news"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => save(false)}
                    disabled={saving}
                    className="h-10 rounded-md border border-white/[0.12] px-3 text-sm font-semibold text-white/70 hover:text-white disabled:opacity-40"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => save(true)}
                    disabled={saving}
                    className="h-10 rounded-md bg-[#FF1A1A] px-3 text-sm font-semibold text-white hover:bg-[#B30000] disabled:opacity-40"
                  >
                    Publish
                  </button>
                  {article.is_published && (
                    <button
                      onClick={() => save(false)}
                      disabled={saving}
                      className="h-10 rounded-md border border-[#FF6B35]/30 px-3 text-sm font-semibold text-[#FF9A74] disabled:opacity-40"
                    >
                      Unpublish
                    </button>
                  )}
                </div>
                {message && <p className="mt-3 text-sm text-[#4DCC8A]">{message}</p>}
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
                <h2 className="text-sm font-semibold text-white">Facebook</h2>
                <div className="mt-4 rounded-md border border-white/[0.08] bg-[#050505] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[1.4px] text-white/35">Post status</p>
                  <p className={article.facebook_post_id ? "mt-1 text-sm font-semibold text-[#4DCC8A]" : "mt-1 text-sm font-semibold text-white/60"}>
                    {article.facebook_post_id ? "Posted" : "Not posted"}
                  </p>
                  {article.facebook_post_id && (
                    <p className="mt-2 break-all text-xs text-white/35">
                      {article.facebook_post_id}
                    </p>
                  )}
                  {article.facebook_post_error && (
                    <p className="mt-2 text-xs leading-5 text-[#FF9A74]">
                      {article.facebook_post_error}
                    </p>
                  )}
                </div>
                <button
                  onClick={postToFacebook}
                  disabled={
                    postingFacebook ||
                    !article.is_published ||
                    !article.hero_image ||
                    Boolean(article.facebook_post_id)
                  }
                  className="mt-4 h-10 w-full rounded-md border border-[#1877F2]/45 bg-[#1877F2]/15 px-3 text-sm font-semibold text-[#B7D9FF] hover:bg-[#1877F2]/25 disabled:opacity-40"
                >
                  {postingFacebook
                    ? "Posting..."
                    : article.facebook_post_id
                      ? "Posted to Facebook"
                      : "Post to Facebook"}
                </button>
                {!article.is_published && (
                  <p className="mt-2 text-xs text-white/35">Publish before posting to Facebook.</p>
                )}
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
                <h2 className="text-sm font-semibold text-white">SEO</h2>
                <input value={article.seo_title} onChange={(e) => update("seo_title", e.target.value)} placeholder="SEO title" className="mt-4 w-full rounded-md border border-white/[0.08] bg-[#050505] px-3 py-2 text-sm text-white" />
                <textarea value={article.seo_description} onChange={(e) => update("seo_description", e.target.value)} placeholder="SEO description" rows={4} className="mt-3 w-full rounded-md border border-white/[0.08] bg-[#050505] px-3 py-2 text-sm text-white" />
                <input value={article.hero_image} onChange={(e) => update("hero_image", e.target.value)} placeholder="Hero image URL" className="mt-3 w-full rounded-md border border-white/[0.08] bg-[#050505] px-3 py-2 text-sm text-white" />
              </div>

              <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#0D0D0D]">
                <div className="border-b border-white/[0.08] px-4 py-3">
                  <h2 className="text-sm font-semibold text-white">Hero Image</h2>
                  <p className="mt-1 text-xs text-white/40">Preview of the image that will appear with this article.</p>
                </div>
                {article.hero_image ? (
                  <div className="p-3">
                    <div className="overflow-hidden rounded-md border border-white/[0.08] bg-[#050505]">
                      <Image
                        src={article.hero_image}
                        alt={article.title}
                        width={640}
                        height={360}
                        unoptimized
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                    <p className="mt-3 break-all text-xs leading-5 text-white/40">
                      {article.hero_image}
                    </p>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-white/35">
                    No hero image selected.
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
                <h2 className="text-sm font-semibold text-white">Quality Checks</h2>
                <div className="mt-4 space-y-2">
                  {checks.map((check) => (
                    <div key={check.label} className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{check.label}</span>
                      <span className={check.ok ? "text-[#4DCC8A]" : "text-[#FF9A74]"}>
                        {check.ok ? "OK" : "Check"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.08] bg-[#0D0D0D] p-4">
                <h2 className="text-sm font-semibold text-white">Source</h2>
                <p className="mt-3 break-all text-xs leading-5 text-white/45">{article.source_url || "-"}</p>
                {article.is_published && (
                  <Link href={`/news/${article.slug}`} className="mt-4 inline-flex rounded border border-white/[0.12] px-3 py-2 text-xs text-white/60">
                    View public page
                  </Link>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}
