import crypto from "crypto"

const TRACKING_PARAMS = [
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]

export function normalizeNewsUrl(url: string) {
  try {
    const parsed = new URL(url)
    parsed.hash = ""

    for (const key of Array.from(parsed.searchParams.keys())) {
      const lower = key.toLowerCase()
      if (lower.startsWith("utm_") || TRACKING_PARAMS.includes(lower)) {
        parsed.searchParams.delete(key)
      }
    }

    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")

    return parsed.toString()
  } catch {
    return url.trim()
  }
}

export function normalizeTitle(title: string | null | undefined) {
  return (title || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function hashText(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export function hashUrl(url: string) {
  return hashText(normalizeNewsUrl(url))
}

export function hashTitle(title: string | null | undefined) {
  const normalized = normalizeTitle(title)
  return normalized ? hashText(normalized) : null
}

export function hashContent(content: string) {
  const normalized = content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000)

  return hashText(normalized)
}
