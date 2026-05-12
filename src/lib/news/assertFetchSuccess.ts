export function assertFetchSuccess(
  html: string | null,
  status?: number
) {
  if (!html || html.length < 500) {
    throw new Error("FETCH_EMPTY_CONTENT")
  }

  if (status && status >= 400) {
    throw new Error(`FETCH_HTTP_${status}`)
  }

  return true
}