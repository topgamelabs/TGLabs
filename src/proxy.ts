import { NextResponse, type NextRequest } from "next/server"
import { isOperationalRequestAuthorized } from "@/lib/apiAuth"

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="TGLabs Admin"',
    },
  })
}

export function proxy(req: NextRequest) {
  if (isOperationalRequestAuthorized(req)) {
    return NextResponse.next()
  }

  return unauthorizedResponse()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/ai/generate-article",
  ],
}
