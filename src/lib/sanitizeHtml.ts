const ALLOWED_SIMPLE_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
])

const RAW_CONTENT_TAG_PATTERN =
  /<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g
const HTML_TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*)?>/g

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;")
}

function sanitizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return parsed.toString()
    }
  } catch {
    return null
  }

  return null
}

function getHref(attributes = "") {
  return getAttribute(attributes, "href")
}

function getAttribute(attributes: string | undefined, name: string) {
  if (!attributes) return ""

  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`, "i")
  )

  return match?.[1] || match?.[2] || match?.[3] || ""
}

function sanitizeAllowedTag(tag: string, attributes: string | undefined, closing: boolean) {
  const normalizedTag = tag.toLowerCase()

  if (normalizedTag === "a") {
    if (closing) return "</a>"

    const safeHref = sanitizeUrl(getHref(attributes))
    if (!safeHref) return ""

    return `<a href="${escapeAttribute(safeHref)}" rel="noopener noreferrer">`
  }

  if (normalizedTag === "img") {
    if (closing) return ""

    const safeSrc = sanitizeUrl(getAttribute(attributes, "src"))
    if (!safeSrc) return ""

    const alt = getAttribute(attributes, "alt")
    return `<img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(alt)}" loading="lazy">`
  }

  if (!ALLOWED_SIMPLE_TAGS.has(normalizedTag)) return ""
  if (normalizedTag === "br") return "<br>"

  return closing ? `</${normalizedTag}>` : `<${normalizedTag}>`
}

export function sanitizeHtml(value: string | null | undefined) {
  if (!value) return ""

  const marker = `TGLABS_SANITIZE_${Math.random().toString(36).slice(2)}_`
  const placeholders: string[] = []
  const withoutRawContent = String(value)
    .replace(RAW_CONTENT_TAG_PATTERN, "")
    .replace(HTML_COMMENT_PATTERN, "")

  const tokenized = withoutRawContent.replace(
    HTML_TAG_PATTERN,
    (tag, tagName: string, attributes: string | undefined) => {
      const closing = tag.startsWith("</")
      const sanitizedTag = sanitizeAllowedTag(tagName, attributes, closing)
      if (!sanitizedTag) return ""

      const token = `${marker}${placeholders.length}__`
      placeholders.push(sanitizedTag)
      return token
    }
  )

  let escaped = escapeHtml(tokenized)

  placeholders.forEach((tag, index) => {
    escaped = escaped.replaceAll(`${marker}${index}__`, tag)
  })

  return escaped
}
