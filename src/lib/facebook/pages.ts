import { requireEnv } from "@/lib/env"
import { readFile } from "node:fs/promises"
import { basename, extname } from "node:path"

const DEFAULT_GRAPH_API_VERSION = "v25.0"

export type FacebookPagePostInput = {
  message: string
  link?: string
  published?: boolean
  scheduledPublishTime?: string | number
}

export type FacebookPagePostResult = {
  id: string
}

export type FacebookPagePhotoPostInput = {
  imageUrl: string
  caption: string
  published?: boolean
  scheduledPublishTime?: string | number
}

export type FacebookPagePhotoUploadInput = {
  imageFilePath: string
  caption: string
  published?: boolean
  scheduledPublishTime?: string | number
}

export type FacebookPagePhotoPostResult = {
  id: string
  post_id?: string
}

export type FacebookPageCommentInput = {
  objectId: string
  message: string
}

export type FacebookPageCommentResult = {
  id: string
}

type FacebookErrorPayload = {
  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

function getGraphApiVersion() {
  return process.env.FACEBOOK_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION
}

function getPageFeedEndpoint() {
  const pageId = requireEnv("FACEBOOK_PAGE_ID")
  return `https://graph.facebook.com/${getGraphApiVersion()}/${pageId}/feed`
}

function getPagePhotosEndpoint() {
  const pageId = requireEnv("FACEBOOK_PAGE_ID")
  return `https://graph.facebook.com/${getGraphApiVersion()}/${pageId}/photos`
}

function getCommentsEndpoint(objectId: string) {
  return `https://graph.facebook.com/${getGraphApiVersion()}/${objectId}/comments`
}

function normalizeMessage(message: string) {
  return message
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatFacebookError(payload: FacebookErrorPayload, fallback: string) {
  if (!payload.error) return fallback

  const parts = [
    payload.error.message,
    payload.error.type ? `type=${payload.error.type}` : null,
    payload.error.code ? `code=${payload.error.code}` : null,
    payload.error.error_subcode
      ? `subcode=${payload.error.error_subcode}`
      : null,
    payload.error.fbtrace_id ? `trace=${payload.error.fbtrace_id}` : null,
  ].filter(Boolean)

  return parts.join(" | ") || fallback
}

function mimeTypeForImagePath(filePath: string) {
  const ext = extname(filePath).toLowerCase()

  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"

  throw new Error("FACEBOOK_IMAGE_FILE_MUST_BE_JPEG_PNG_OR_WEBP")
}

async function parseFacebookPhotoResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as
    | FacebookPagePhotoPostResult
    | FacebookErrorPayload

  if (!response.ok || !("id" in payload)) {
    throw new Error(
      formatFacebookError(
        payload as FacebookErrorPayload,
        "FACEBOOK_PAGE_PHOTO_POST_FAILED"
      )
    )
  }

  return payload
}

export async function publishFacebookPagePost(input: FacebookPagePostInput) {
  const message = normalizeMessage(input.message)

  if (!message) {
    throw new Error("FACEBOOK_MESSAGE_REQUIRED")
  }

  const body: Record<string, string | number | boolean> = {
    message,
    access_token: requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN"),
  }

  if (input.link) {
    body.link = input.link
  }

  if (typeof input.published === "boolean") {
    body.published = input.published
  }

  if (input.scheduledPublishTime) {
    body.published = false
    body.scheduled_publish_time = input.scheduledPublishTime
  }

  const response = await fetch(getPageFeedEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => ({}))) as
    | FacebookPagePostResult
    | FacebookErrorPayload

  if (!response.ok || !("id" in payload)) {
    throw new Error(
      formatFacebookError(
        payload as FacebookErrorPayload,
        "FACEBOOK_PAGE_POST_FAILED"
      )
    )
  }

  return payload
}

export async function publishFacebookPagePhotoPost(
  input: FacebookPagePhotoPostInput
) {
  const caption = normalizeMessage(input.caption)
  const imageUrl = input.imageUrl.trim()

  if (!caption) {
    throw new Error("FACEBOOK_CAPTION_REQUIRED")
  }

  if (!/^https:\/\//i.test(imageUrl)) {
    throw new Error("FACEBOOK_IMAGE_URL_MUST_BE_PUBLIC_HTTPS")
  }

  const body: Record<string, string | number | boolean> = {
    url: imageUrl,
    caption,
    access_token: requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN"),
  }

  if (typeof input.published === "boolean") {
    body.published = input.published
  }

  if (input.scheduledPublishTime) {
    body.published = false
    body.scheduled_publish_time = input.scheduledPublishTime
  }

  const response = await fetch(getPagePhotosEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  return parseFacebookPhotoResponse(response)
}

export async function publishFacebookPagePhotoUpload(
  input: FacebookPagePhotoUploadInput
) {
  const caption = normalizeMessage(input.caption)
  const imageFilePath = input.imageFilePath.trim()

  if (!caption) {
    throw new Error("FACEBOOK_CAPTION_REQUIRED")
  }

  if (!imageFilePath) {
    throw new Error("FACEBOOK_IMAGE_FILE_PATH_REQUIRED")
  }

  const bytes = await readFile(imageFilePath)
  const form = new FormData()
  form.set("access_token", requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN"))
  form.set("caption", caption)
  form.set(
    "source",
    new Blob([new Uint8Array(bytes)], {
      type: mimeTypeForImagePath(imageFilePath),
    }),
    basename(imageFilePath)
  )

  if (typeof input.published === "boolean") {
    form.set("published", String(input.published))
  }

  if (input.scheduledPublishTime) {
    form.set("published", "false")
    form.set("scheduled_publish_time", String(input.scheduledPublishTime))
  }

  const response = await fetch(getPagePhotosEndpoint(), {
    method: "POST",
    body: form,
  })

  return parseFacebookPhotoResponse(response)
}

export async function publishFacebookPageComment(
  input: FacebookPageCommentInput
) {
  const message = normalizeMessage(input.message)
  const objectId = input.objectId.trim()

  if (!objectId) {
    throw new Error("FACEBOOK_COMMENT_OBJECT_ID_REQUIRED")
  }

  if (!message) {
    throw new Error("FACEBOOK_COMMENT_MESSAGE_REQUIRED")
  }

  const body: Record<string, string> = {
    message,
    access_token: requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN"),
  }

  const response = await fetch(getCommentsEndpoint(objectId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json().catch(() => ({}))) as
    | FacebookPageCommentResult
    | FacebookErrorPayload

  if (!response.ok || !("id" in payload)) {
    throw new Error(
      formatFacebookError(
        payload as FacebookErrorPayload,
        "FACEBOOK_PAGE_COMMENT_FAILED"
      )
    )
  }

  return payload
}
