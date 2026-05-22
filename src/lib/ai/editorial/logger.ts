import type { PipelineLogEvent } from "./types"

export function logEditorialDecision(event: PipelineLogEvent) {
  const payload = {
    at: new Date().toISOString(),
    ...event,
  }

  console.log("[EditorialPipeline]", JSON.stringify(payload))
}

