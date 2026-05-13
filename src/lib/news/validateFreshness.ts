const MAX_NEWS_AGE_HOURS = 48

export type FreshnessStatus = "accepted" | "rejected"

export function validateFreshness(publishedAt?: string | null): {
  status: FreshnessStatus
  reason: string | null
} {
  if (!publishedAt) {
    return {
      status: "rejected",
      reason: "missing_publish_date"
    }
  }

  const publishedDate = new Date(publishedAt)
  const now = new Date()

  if (Number.isNaN(publishedDate.getTime())) {
    return {
      status: "rejected",
      reason: "invalid_publish_date"
    }
  }

  const diffHours =
    (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60)

  if (diffHours < -2) {
    return {
      status: "rejected",
      reason: "publish_date_in_future"
    }
  }

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
