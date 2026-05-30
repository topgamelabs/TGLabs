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
  const parsed = {
    articleId: "",
    generated: "",
    final: "",
    bucket: process.env.FACEBOOK_CREATIVE_BUCKET || "images",
  }
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--article-id") parsed.articleId = args[++i] || ""
    if (arg === "--generated") parsed.generated = args[++i] || ""
    if (arg === "--final") parsed.final = args[++i] || ""
    if (arg === "--bucket") parsed.bucket = args[++i] || parsed.bucket
  }

  return parsed
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  throw new Error(`Unsupported image extension: ${ext}`)
}

function storagePath(articleId, kind, filePath) {
  return `facebook-creative/${articleId}/${kind}${path
    .extname(filePath)
    .toLowerCase()}`
}

async function uploadImage(supabase, bucket, articleId, kind, filePath) {
  if (!filePath) return null

  const resolved = path.resolve(root, filePath)
  const targetPath = storagePath(articleId, kind, resolved)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(targetPath, fs.readFileSync(resolved), {
      contentType: mimeTypeFor(resolved),
      upsert: true,
    })

  if (error) throw new Error(`${kind.toUpperCase()}_UPLOAD_FAILED: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(targetPath)
  return {
    kind,
    localPath: resolved,
    storagePath: targetPath,
    publicUrl: data.publicUrl,
  }
}

async function main() {
  loadDotEnv(path.join(root, ".env.local"))

  const args = parseArgs()
  if (!args.articleId) throw new Error("--article-id is required")
  if (!args.final) throw new Error("--final is required")

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  )

  const uploaded = []
  const generated = await uploadImage(
    supabase,
    args.bucket,
    args.articleId,
    "generated",
    args.generated
  )
  if (generated) uploaded.push(generated)

  uploaded.push(
    await uploadImage(supabase, args.bucket, args.articleId, "final", args.final)
  )

  console.log(JSON.stringify({ success: true, bucket: args.bucket, uploaded }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
