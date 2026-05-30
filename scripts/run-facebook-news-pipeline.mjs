import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const key = match[1]
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) process.env[key] = value
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {
    articleId: "",
    dryRun: false,
    limit: 1,
    baseUrl: process.env.TGLABS_LOCAL_BASE_URL || "http://localhost:3000",
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === "--article-id") parsed.articleId = args[++i] || ""
    if (arg === "--dry-run") parsed.dryRun = true
    if (arg === "--limit") parsed.limit = Number(args[++i] || 1)
    if (arg === "--base-url") parsed.baseUrl = args[++i] || parsed.baseUrl
  }

  return parsed
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function findArticle(supabase, articleId) {
  const columns =
    "id,title,slug,status,is_published,hero_image,facebook_post_id,created_at"

  if (articleId) {
    const { data, error } = await supabase
      .from("articles")
      .select(columns)
      .eq("id", articleId)
      .single()

    if (error) throw new Error(`ARTICLE_SELECT_FAILED: ${error.message}`)
    return data
  }

  const { data, error } = await supabase
    .from("articles")
    .select(columns)
    .eq("status", "draft")
    .eq("is_published", false)
    .is("facebook_post_id", null)
    .not("hero_image", "is", null)
    .order("created_at", { ascending: true })
    .limit(1)

  if (error) throw new Error(`ARTICLE_SELECT_FAILED: ${error.message}`)
  return data?.[0] || null
}

async function findStoredFinalImage(supabase, articleId) {
  const bucket = process.env.FACEBOOK_CREATIVE_BUCKET || "images"
  const extensions = [".png", ".jpg", ".jpeg", ".webp"]

  for (const extension of extensions) {
    const storagePath = `facebook-creative/${articleId}/final${extension}`
    const { error } = await supabase.storage.from(bucket).download(storagePath)

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      return {
        bucket,
        storagePath,
        publicUrl: data.publicUrl,
      }
    }
  }

  return null
}

async function callPostApi(article, baseUrl, dryRun) {
  const headers = { "Content-Type": "application/json" }

  if (process.env.TGLABS_ADMIN_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.TGLABS_ADMIN_API_TOKEN}`
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/facebook/post`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mode: "photo",
      articleId: article.id,
      publishArticle: true,
      dryRun,
    }),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `POST_API_FAILED_${response.status}`)
  }

  return payload
}

async function main() {
  loadDotEnv(path.join(root, ".env.local"))

  const args = parseArgs()
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  )
  const article = await findArticle(supabase, args.articleId)

  if (!article) {
    console.log("No draft article is ready for the Facebook pipeline.")
    return
  }

  if (article.facebook_post_id) {
    throw new Error(`Article already has facebook_post_id: ${article.facebook_post_id}`)
  }

  const creative = await findStoredFinalImage(supabase, article.id)

  if (!creative) {
    throw new Error(
      `Missing final image in Supabase Storage for article ${article.id}. Upload the overlay image first.`
    )
  }

  console.log(
    JSON.stringify(
      {
        dryRun: args.dryRun,
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          status: article.status,
        },
        creative: {
          storagePath: creative.storagePath,
          finalImageUrl: creative.publicUrl,
        },
      },
      null,
      2
    )
  )

  const result = await callPostApi(article, args.baseUrl, args.dryRun)
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
