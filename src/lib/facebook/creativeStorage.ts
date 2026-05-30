import { extname } from "node:path"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const DEFAULT_BUCKET = "images"
const FINAL_BASENAME = "final"
const GENERATED_BASENAME = "generated"
const SUPPORTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const

export type FacebookCreativeImageKind = "generated" | "final"

function bucketName() {
  return process.env.FACEBOOK_CREATIVE_BUCKET || DEFAULT_BUCKET
}

function normalizeExtension(filePathOrExtension: string) {
  const extension = filePathOrExtension.startsWith(".")
    ? filePathOrExtension
    : extname(filePathOrExtension)
  const normalized = extension.toLowerCase()

  if (!SUPPORTED_IMAGE_EXTENSIONS.includes(normalized as never)) {
    throw new Error("FACEBOOK_CREATIVE_IMAGE_MUST_BE_JPEG_PNG_OR_WEBP")
  }

  return normalized
}

export function facebookCreativeStoragePath(
  articleId: string,
  kind: FacebookCreativeImageKind,
  filePathOrExtension = ".png"
) {
  const basename = kind === "final" ? FINAL_BASENAME : GENERATED_BASENAME
  return `facebook-creative/${articleId}/${basename}${normalizeExtension(
    filePathOrExtension
  )}`
}

export function getFacebookCreativePublicUrl(storagePath: string) {
  const { data } = supabaseAdmin.storage
    .from(bucketName())
    .getPublicUrl(storagePath)

  return data.publicUrl
}

export async function getReadyFacebookFinalImage(articleId: string) {
  for (const extension of SUPPORTED_IMAGE_EXTENSIONS) {
    const storagePath = facebookCreativeStoragePath(articleId, "final", extension)
    const { error } = await supabaseAdmin.storage
      .from(bucketName())
      .download(storagePath)

    if (!error) {
      return {
        storagePath,
        publicUrl: getFacebookCreativePublicUrl(storagePath),
      }
    }
  }

  return null
}
