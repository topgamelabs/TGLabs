const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
]

export type FetchContentType = "rss" | "html" | "sitemap"

export interface FetchWithRetryOptions {
  contentType?: FetchContentType
  timeoutMs?: number
  retries?: number
  referer?: string
}

export interface FetchWithRetryResult {
  url: string
  finalUrl: string
  ok: boolean
  status: number
  body: string
  contentType: string | null
  attempts: number
  blocked: boolean
  error: string | null
}

function getAcceptHeader(contentType: FetchContentType) {
  if (contentType === "rss" || contentType === "sitemap") {
    return "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, text/html;q=0.7, */*;q=0.5"
  }

  return "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

function pickUserAgent(attempt: number) {
  return USER_AGENTS[attempt % USER_AGENTS.length]
}

function looksBlocked(status: number, body: string) {
  if ([401, 403, 406, 418, 429, 503].includes(status)) {
    return true
  }

  const sample = body.slice(0, 2000).toLowerCase()

  return (
    sample.includes("cloudflare") ||
    sample.includes("cf-chl") ||
    sample.includes("access denied") ||
    sample.includes("just a moment") ||
    sample.includes("captcha")
  )
}

function retryable(status: number) {
  return status === 0 || status === 408 || status === 429 || status >= 500
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<FetchWithRetryResult> {
  const contentType = options.contentType || "html"
  const timeoutMs = options.timeoutMs || 12000
  const retries = options.retries ?? 2
  let lastResult: FetchWithRetryResult | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": pickUserAgent(attempt),
          "Accept": getAcceptHeader(contentType),
          "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          ...(options.referer ? { Referer: options.referer } : {}),
        },
      })

      const body = await response.text()
      const blocked = looksBlocked(response.status, body)

      lastResult = {
        url,
        finalUrl: response.url || url,
        ok: response.ok && !blocked,
        status: response.status,
        body,
        contentType: response.headers.get("content-type"),
        attempts: attempt + 1,
        blocked,
        error: response.ok
          ? blocked
            ? `FETCH_BLOCKED_${response.status}`
            : null
          : `FETCH_HTTP_${response.status}`,
      }

      if (lastResult.ok || !retryable(response.status)) {
        return lastResult
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "FETCH_FAILED"

      lastResult = {
        url,
        finalUrl: url,
        ok: false,
        status: 0,
        body: "",
        contentType: null,
        attempts: attempt + 1,
        blocked: false,
        error: message === "This operation was aborted" ? "FETCH_TIMEOUT" : message,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  return (
    lastResult || {
      url,
      finalUrl: url,
      ok: false,
      status: 0,
      body: "",
      contentType: null,
      attempts: retries + 1,
      blocked: false,
      error: "FETCH_FAILED",
    }
  )
}
