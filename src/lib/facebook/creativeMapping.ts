import { readFile } from "node:fs/promises"
import { isAbsolute, relative, resolve } from "node:path"

export type FacebookCreativeMapEntry = {
  articleId: string
  slug?: string
  title?: string
  heroImage?: string
  generatedImagePath?: string
  finalImagePath?: string
  finalImageUrl?: string
  facebookPostId?: string
  facebookFirstCommentId?: string
  status?: "generated" | "final" | "posted" | "skipped"
  createdAt?: string
  updatedAt?: string
}

type FacebookCreativeMappingFile = {
  version?: number
  updatedAt?: string
  entries?: FacebookCreativeMapEntry[]
}

function mappingPath() {
  return resolve(
    process.cwd(),
    process.env.FACEBOOK_CREATIVE_MAPPING_PATH ||
      "output/facebook-creative/mapping.json"
  )
}

export function resolveWorkspaceCreativePath(filePath: string) {
  const workspaceRoot = process.cwd()
  const resolved = isAbsolute(filePath)
    ? resolve(filePath)
    : resolve(workspaceRoot, filePath)
  const pathFromWorkspace = relative(workspaceRoot, resolved)

  if (pathFromWorkspace.startsWith("..") || isAbsolute(pathFromWorkspace)) {
    throw new Error("FACEBOOK_CREATIVE_PATH_OUTSIDE_WORKSPACE")
  }

  return resolved
}

export async function loadFacebookCreativeMapping() {
  try {
    const raw = await readFile(mappingPath(), "utf8")
    const parsed = JSON.parse(raw) as FacebookCreativeMappingFile
    return Array.isArray(parsed.entries) ? parsed.entries : []
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return []
    }

    throw error
  }
}

export async function findFacebookCreativeMapping(articleId: string) {
  const entries = await loadFacebookCreativeMapping()
  return entries.find((entry) => entry.articleId === articleId) || null
}
