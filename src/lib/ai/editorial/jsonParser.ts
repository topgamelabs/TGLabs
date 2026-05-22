export function parseAiJsonObject(text: string) {
  const trimmed = text.replace(/```json|```/g, "").trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI_JSON_NOT_FOUND")
  }

  return JSON.parse(trimmed.slice(start, end + 1))
}

export function safeParseAiJsonObject(text: string) {
  try {
    return { ok: true as const, value: parseAiJsonObject(text) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI_JSON_PARSE_FAILED"
    return { ok: false as const, error: message }
  }
}

