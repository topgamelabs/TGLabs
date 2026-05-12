const MAX_NEWS_AGE_HOURS = 48

export function validateFreshness(publishedAt?: string) {
  if (!publishedAt) {
    return {
      status: "rejected",
      reason: "missing_publish_date"
    }
  }

  const publishedDate = new Date(publishedAt)
  const now = new Date()

  const diffHours =
    (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60)

  if (diffHours > MAX_NEWS_AGE_HOURS) {
    return {
      status: "rejected",
      reason: "news_too_old"
    }
  }

  return {
    status: "accepted",
    reason: null
  }
}