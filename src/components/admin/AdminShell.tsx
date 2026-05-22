import Link from "next/link"
import type { ReactNode } from "react"

const navItems = [
  { href: "/admin/newsroom", label: "Newsroom", description: "General queue" },
  {
    href: "/admin/focused-games",
    label: "Focused Games",
    description: "Official source monitor",
  },
  { href: "/admin/generate", label: "Generate", description: "Manual tools" },
]

export function AdminShell({
  active,
  children,
}: {
  active: "newsroom" | "focused-games" | "generate"
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#E8E8E8] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/[0.06] bg-black/80 px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:sticky lg:top-0">
        <Link href="/" className="text-[11px] uppercase tracking-[2px] text-white/40 hover:text-white/70">
          TGLabs Admin
        </Link>
        <nav className="mt-7 space-y-2">
          {navItems.map((item) => {
            const selected = active === item.href.replace("/admin/", "")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg border px-3 py-3 transition-colors ${
                  selected
                    ? "border-[#FF1A1A]/35 bg-[#FF1A1A]/10 text-white"
                    : "border-white/[0.06] bg-white/[0.02] text-white/55 hover:border-white/[0.12] hover:text-white"
                }`}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-white/35">{item.description}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
