import { NextResponse, type NextRequest } from "next/server"

const OPERATIONAL_TOKEN_ENV = "TGLABS_ADMIN_API_TOKEN"
const ADMIN_USERNAME_ENV = "TGLABS_ADMIN_USERNAME"
const ADMIN_PASSWORD_ENV = "TGLABS_ADMIN_PASSWORD"

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

function decodeBasicCredentials(value: string) {
  try {
    const decoded = atob(value)
    const separatorIndex = decoded.indexOf(":")

    if (separatorIndex === -1) return null

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

function isBearerAuthorized(authHeader: string | null) {
  const token = process.env[OPERATIONAL_TOKEN_ENV]
  if (!token || !authHeader?.startsWith("Bearer ")) return false

  return safeEqual(authHeader.slice("Bearer ".length), token)
}

function isBasicAuthorized(authHeader: string | null) {
  const username = process.env[ADMIN_USERNAME_ENV]
  const password = process.env[ADMIN_PASSWORD_ENV]

  if (!username || !password || !authHeader?.startsWith("Basic ")) {
    return false
  }

  const credentials = decodeBasicCredentials(authHeader.slice("Basic ".length))
  if (!credentials) return false

  return (
    safeEqual(credentials.username, username) &&
    safeEqual(credentials.password, password)
  )
}

export function isOperationalRequestAuthorized(req: NextRequest | Request) {
  const authHeader = req.headers.get("authorization")

  if (isBearerAuthorized(authHeader) || isBasicAuthorized(authHeader)) {
    return true
  }

  if (
    !process.env[OPERATIONAL_TOKEN_ENV] &&
    !process.env[ADMIN_USERNAME_ENV] &&
    !process.env[ADMIN_PASSWORD_ENV]
  ) {
    return process.env.NODE_ENV !== "production"
  }

  return false
}

export function requireOperationalAuth(req: NextRequest | Request) {
  if (isOperationalRequestAuthorized(req)) return null

  return NextResponse.json(
    { success: false, error: "UNAUTHORIZED" },
    { status: 401 }
  )
}
