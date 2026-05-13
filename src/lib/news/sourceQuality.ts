export interface SourceQualityResult {
  allowed: boolean
  reason: string | null
}

const MAX_BLOCKED_COUNT = 5
const COOLDOWN_HOURS = 6
const MIN_SOURCE_SCORE = 40

function asDate(value: unknown) {
  if (typeof value !== "string") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function hasBoolean(source: Record<string, unknown>, key: string) {
  return typeof source[key] === "boolean"
}

export function validateSourceQuality(
  source: Record<string, unknown>
): SourceQualityResult {
  if (hasBoolean(source, "is_active") && source.is_active === false) {
    return { allowed: false, reason: "source_inactive" }
  }

  if (hasBoolean(source, "enabled") && source.enabled === false) {
    return { allowed: false, reason: "source_disabled" }
  }

  const score =
    asNumber(source.source_score) ??
    asNumber(source.quality_score) ??
    asNumber(source.source_quality_score)

  if (score !== null && score < MIN_SOURCE_SCORE) {
    return { allowed: false, reason: "source_quality_too_low" }
  }

  const blockedCount = asNumber(source.blocked_count) || 0
  const lastFailureAt = asDate(source.last_failure_at)

  if (blockedCount >= MAX_BLOCKED_COUNT && lastFailureAt) {
    const diffHours =
      (Date.now() - lastFailureAt.getTime()) / (1000 * 60 * 60)

    if (diffHours < COOLDOWN_HOURS) {
      return { allowed: false, reason: "source_blocked_cooldown" }
    }
  }

  return { allowed: true, reason: null }
}
