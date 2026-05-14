import Link from "next/link";
import { getArticles } from "@/lib/supabase";

export const revalidate = 60;

export default async function MobileNewsPage() {
  const articles = await getArticles({ limit: 20 });

  // Filter only mobile articles
  const mobileArticles = articles.filter(a => {
    if (a.category?.toLowerCase() === "mobile") return true;
    const game = a.games;
    return game?.platform === "mobile" || game?.platform === "cross-platform";
  });

  return (
    <div className="min-h-screen bg-[#000000] text-[#E8E8E8] font-sans">

      {/* ========== NAVBAR ========== */}
      <nav className="sticky top-0 z-[100] bg-[rgba(0,0,0,0.95)] backdrop-blur-[12px] border-b border-white/[0.06] h-[64px]">
        <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-[10px] flex-shrink-0">
            <img
              src="https://www.tglabs.info/images/logo.png"
              alt="TopGame Thailand"
              className="w-9 h-9 object-contain"
            />
            <div className="flex flex-col leading-none">
              <span className="font-['Bebas_Neue'] text-[18px] tracking-[2px] text-white">
                TOP<span className="text-[#FF1A1A]">GAME</span>
              </span>
              <span className="text-[8px] tracking-[3px] text-white/[0.4] uppercase">Thailand</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Home</Link>
            <Link href="/news" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">News</Link>
            <Link href="/news/mobile" className="text-[13px] text-[#FF1A1A] hover:text-[#FF1A1A]/80 transition-colors">Mobile</Link>
            <Link href="/guides" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Guides</Link>
            <Link href="/reviews" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Reviews</Link>
            <Link href="/it-gadget" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">IT Gadget</Link>
            <Link href="#tools" className="text-[13px] text-[#FF1A1A] hover:text-[#FF1A1A]/80 transition-colors">Tools ⚡</Link>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-white/[0.06] transition-colors" aria-label="Search">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeWidth="2" d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1280px] mx-auto px-4">

        {/* ========== AD: HEADER BANNER ========== */}
        <div className="h-[70px] mb-4 flex items-center justify-center bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
          <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 728×90 </span>
        </div>

        {/* ========== PAGE HEADER ========== */}
        <div className="py-8">
          <h1 className="font-['Kanit'] text-[32px] font-semibold text-white">ข่าวเกมมือถือ</h1>
          <p className="text-[14px] text-[#AAAAAA] mt-2">อัปเดตข่าวเกมมือถือล่าสุด</p>
        </div>

        {/* ========== MAIN LAYOUT ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 pb-12">

          {/* ========== ARTICLES GRID ========== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.isArray(mobileArticles) && mobileArticles.length > 0 ? mobileArticles.map((a: any) => (
              <Link
                key={a.id}
                href={`/news/${a.slug}`}
                className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] hover:-translate-y-[4px] hover:border-[#FF1A1A]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer group"
              >
                {/* Hero Image */}
                {a.hero_image ? (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={a.hero_image}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-[#1A1A1A]" />
                )}

                {/* Content */}
                <div className="px-3 py-0">
                  <div className="text-[10px] font-bold tracking-[1px] uppercase text-[#FF1A1A] mb-1">
                    MOBILE
                  </div>
                  <h2 className="font-['Kanit'] text-[15px] font-semibold text-white leading-[1.3] line-clamp-2 group-hover:text-[#FF1A1A] transition-colors">
                    {a.title}
                  </h2>
                  <p className="text-[12px] text-[#AAAAAA] mt-1 line-clamp-2">
                    {a.excerpt}
                  </p>
                  <div className="text-[10px] text-[#666666]">
                    {a.read_time || 3} นาที • {a.games?.name || "Mobile Game"}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-2 py-20 text-center text-[#AAAAAA]">
                ไม่มีข่าวเกมมือถือในขณะนี้
              </div>
            )}
          </div>

          {/* ========== SIDEBAR ========== */}
          <aside className="hidden lg:block">

            {/* AD */}
            <div className="h-[250px] mb-6 flex items-center justify-center bg-gradient-to-br from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 300×250 </span>
            </div>

            {/* Trending Widget */}
            <div className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] mb-6">
              <div className="px-4 py-3 border-b border-white/[0.05] font-['Kanit'] text-[13px] font-semibold text-white">
                🔥 Trending Mobile
              </div>
              <div>
                {(Array.isArray(mobileArticles) ? mobileArticles.slice(0, 5) : []).map((item: any, i: number) => (
                  <Link
                    key={item.id || i}
                    href={`/news/${item.slug}`}
                    className="flex gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="font-['Bebas_Neue'] text-[20px] text-white/[0.1] w-6 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="text-[13px] text-white leading-[1.4] line-clamp-2">{item.title}</div>
                      <div className="text-[11px] text-[#AAAAAA] mt-1">{item.read_time || 3} min read</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories Widget */}
            <div className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] mb-6">
              <div className="px-4 py-3 border-b border-white/[0.05] font-['Kanit'] text-[13px] font-semibold text-white">
                📂 Categories
              </div>
              <div className="px-4 py-2">
                {[
                  { name: "📰 News", href: "/news", count: "124" },
                  { name: "📱 Mobile", href: "/news/mobile", count: mobileArticles.length.toString() },
                  { name: "🎮 Reviews", href: "/reviews", count: "89" },
                  { name: "🔥 Tips & Tricks", href: "/guides", count: "156" },
                  { name: "💻 IT Gadget", href: "/it-gadget", count: "43" },
                  { name: "🏆 Tournament", href: "/tournament", count: "67" },
                ].map((cat) => (
                  <a
                    key={cat.href}
                    href={cat.href}
                    className="flex justify-between py-2 border-b border-white/[0.05] last:border-0 text-[13px] text-[#AAAAAA] hover:text-white transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[#666666]">{cat.count}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* AD Tall */}
            <div className="min-h-[300px] flex items-center justify-center bg-gradient-to-br from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 300×600 </span>
            </div>

          </aside>
        </div>

        {/* ========== FOOTER ========== */}
        <footer className="mt-12 py-8 border-t border-white/[0.05]">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://www.tglabs.info/images/logo.png"
                  alt="TopGame Thailand"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-['Bebas_Neue'] text-[16px] tracking-[2px] text-white">
                  TOP<span className="text-[#FF1A1A]">GAME</span>
                </span>
              </div>
              <p className="text-[13px] text-[#AAAAAA] leading-[1.6]">
                แหล่งรวมข่าวเกมมือถือ อัปเดตใหม่ รีวิว เทคนิค และ Tier List ครบทุกเกมดังในไทย
              </p>
              <div className="flex gap-4">
                <a href="https://www.youtube.com/@topgame_th" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#AAAAAA] hover:text-[#FF1A1A] transition-colors">YouTube</a>
                <a href="https://www.facebook.com/topgameth" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#AAAAAA] hover:text-[#FF1A1A] transition-colors">Facebook</a>
                <a href="https://discord.gg/topgameth" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#AAAAAA] hover:text-[#FF1A1A] transition-colors">Discord</a>
              </div>
            </div>
            <div>
              <div className="font-['Kanit'] text-[13px] font-semibold text-white uppercase tracking-[1px] mb-4">Content</div>
              <div className="flex flex-col gap-2">
                <a href="/news" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">ข่าวสาร</a>
                <a href="/news/mobile" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">เกมมือถือ</a>
                <a href="/reviews" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">รีวิว</a>
                <a href="/guides" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">เทคนิค</a>
                <a href="/it-gadget" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">IT Gadget</a>
              </div>
            </div>
            <div>
              <div className="font-['Kanit'] text-[13px] font-semibold text-white uppercase tracking-[1px] mb-4">Tools</div>
              <div className="flex flex-col gap-2">
                <a href="https://bosstimer.tglabs.info/" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Boss Timer</a>
                <a href="/tierlist" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Tier List</a>
                <a href="/codes" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Codes</a>
              </div>
            </div>
          </div>

          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FF1A1A] to-transparent my-6" />

          <div className="text-center">
            <span className="text-[12px] text-white/[0.2]">© 2026 TopGame Thailand. All rights reserved.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}