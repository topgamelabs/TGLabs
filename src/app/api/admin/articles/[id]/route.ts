import { NextResponse, type NextRequest } from "next/server"
import { requireOperationalAuth } from "@/lib/apiAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select(
      "id,title,slug,excerpt,content,category,hero_image,status,is_published,seo_title,seo_description,source_url,published_at,created_at,updated_at,facebook_post_id,facebook_posted_at,facebook_first_comment_id,facebook_post_error,facebook_last_attempt_at"
    )
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, article: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireOperationalAuth(req)
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await req.json()
    const patch = {
      title: String(body.title || "").trim(),
      slug: String(body.slug || "").trim(),
      excerpt: String(body.excerpt || "").trim(),
      content: String(body.content || "").trim(),
      category: String(body.category || "gaming").trim(),
      hero_image: body.hero_image ? String(body.hero_image).trim() : null,
      seo_title: body.seo_title ? String(body.seo_title).trim() : null,
      seo_description: body.seo_description
        ? String(body.seo_description).trim()
        : null,
      status: body.is_published ? "published" : "draft",
      is_published: Boolean(body.is_published),
      published_at: body.is_published
        ? body.published_at || new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }

    if (!patch.title || !patch.slug || !patch.content) {
      return NextResponse.json(
        { success: false, error: "TITLE_SLUG_CONTENT_REQUIRED" },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("articles")
      .update(patch)
      .eq("id", id)
      .select("id,slug,title")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true, article: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "ARTICLE_UPDATE_FAILED"

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
