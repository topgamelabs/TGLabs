import { notFound } from "next/navigation";
import Link from "next/link";

async function getArticle(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?slug=eq.${slug}&select=*`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );
  const data = await res.json();
  return data?.[0] || null;
}

async function getRelated() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?limit=4&order=created_at.desc`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      cache: "no-store",
    }
  );
  return res.json();
}

// Category badge colors
const categoryColors: Record<string, string> = {
  tips: "bg-[#FF1A1A] text-white",
  live: "bg-[#FF6B35] text-white",
  news: "bg-[#4A90D9] text-white",
  review: "bg-[#4DCC8A] text-white",
  tech: "bg-[#A855F7] text-white",
  tournament: "bg-[#FFD700] text-black",
};

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [article, related] = await Promise.all([getArticle(slug), getRelated()]);
  if (!article) return notFound();

  const c = (article.category || "news").toLowerCase();
  const colorClass = categoryColors[c] || categoryColors.news;
  const categoryIcon = c === "tips" ? "🔥 " : c === "live" ? "📺 " : c === "news" ? "📰 " : c === "review" ? "🎮 " : c === "tech" ? "💻 " : c === "tournament" ? "🏆 " : "";

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

        {/* ========== BREADCRUMB ========== */}
        <nav className="py-4 text-[12px] text-[#AAAAAA]">
          <Link href="/" className="hover:text-[#FF1A1A] transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/news" className="hover:text-[#FF1A1A] transition-colors">News</Link>
          <span className="mx-2">›</span>
          <span className="text-[#E8E8E8]">{article.title}</span>
        </nav>

        {/* ========== ARTICLE LAYOUT ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ========== MAIN CONTENT ========== */}
          <main className="min-w-0">

            {/* Article Hero */}
            <div className="rounded-xl overflow-hidden mb-8 relative">
              <img
                src={article.hero_image || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop"}
                alt={article.title}
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/[0.7] to-transparent" />
            </div>

            {/* Article Header */}
            <header className="mb-8">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold tracking-[1.5px] uppercase ${colorClass}`}>
                {categoryIcon}{c}
              </span>
              <h1 className="font-['Kanit'] text-[28px] lg:text-[32px] font-semibold text-white leading-[1.3] mt-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-[13px] text-[#AAAAAA]">

                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1A1A1A]" />
                  <span className="text-[#E8E8E8] font-medium">TopGame TH</span>
                </div>

                <span className="text-[#666666]">•</span>
                <span>{formatDate(article.created_at)}</span>
                <span className="text-[#666666]">•</span>
                <span>👁 {article.view_count?.toLocaleString() || "0"} views</span>

                {/* Share */}
                <div className="flex gap-2 ml-auto">
                  <button className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-[#1A1A1A] hover:border-[#FF1A1A] transition-colors text-[14px]">📘</button>
                  <button className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-[#1A1A1A] hover:border-[#FF1A1A] transition-colors text-[14px]">🐦</button>
                  <button className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-[#1A1A1A] hover:border-[#FF1A1A] transition-colors text-[14px]">🔗</button>
                </div>
              </div>
            </header>

            {/* AD: Inline */}
            <div className="h-[100px] mb-8 flex items-center justify-center bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 728×100 </span>
            </div>

            {/* Article Content */}
            <article className="text-[15px] leading-[1.8] text-white/[0.85]">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />

              {/* Source */}
              {article.source_url && (
                <p className="mt-10 text-[13px] text-[#AAAAAA]">
                  แหล่งที่มา:{" "}
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FF1A1A]">
                    {article.source_url}
                  </a>
                </p>
              )}
            </article>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-8">
              {["#News", "#Gaming", "#Mobile"].map((tag) => (
                <a key={tag} href={`/tags/${tag.slice(1)}`} className="px-3 py-1 rounded-full text-[12px] bg-[#0D0D0D] border border-white/[0.06] text-[#AAAAAA] hover:border-[#FF1A1A] hover:text-[#FF1A1A] transition-colors">
                  {tag}
                </a>
              ))}
            </div>

            {/* Author Box */}
            <div className="mt-10 p-6 bg-[#0D0D0D] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex-shrink-0" />
                <div>
                  <div className="font-['Kanit'] text-[14px] font-semibold text-white">TopGame TH</div>
                  <div className="text-[12px] text-[#AAAAAA]">Content Creator @ TopGame Thailand</div>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-[#AAAAAA] leading-[1.6]">
                ผู้เชี่ยวชาญเกมมือถือ รีวิวเกมมา 5 ปี ติดตามผลงานได้ที่ YouTube: TopGame Thailand
              </p>
            </div>

            {/* AD: Below Content */}
            <div className="h-[120px] my-10 flex items-center justify-center bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 728×120 </span>
            </div>

            {/* Related Articles */}
            <section>
              <div className="flex items-center gap-2 mb-4 font-['Kanit'] text-[16px] font-semibold text-white">
                <span>📰</span> บทความที่เกี่ยวข้อง
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.slice(0, 3).map((item: any, i: number) => (
                  <a
                    key={item.id || i}
                    href={`/news/${item.slug}`}
                    className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] hover:-translate-y-[4px] hover:border-[#FF1A1A]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={item.hero_image || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=250&fit=crop"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold tracking-[1px] uppercase text-[#FF1A1A] mb-2">{item.category?.toUpperCase()}</div>
                      <div className="text-[13px] text-white leading-[1.4] line-clamp-2">{item.title}</div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* Comments Placeholder */}
            <section className="mt-12 p-6 bg-[#0D0D0D] rounded-xl border border-white/[0.04]">
              <div className="font-['Kanit'] text-[16px] font-semibold text-white mb-4">💬 ความคิดเห็น</div>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-[32px] mb-4">💬</div>
                <div className="text-[13px] text-[#AAAAAA]">รอ Disqus integration หรือแสดงความคิดเห็นผ่าน Social Login</div>
              </div>
            </section>

          </main>

          {/* ========== SIDEBAR ========== */}
          <aside className="hidden lg:block">

            {/* AD */}
            <div className="h-[250px] mb-6 flex items-center justify-center bg-gradient-to-br from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 300×250 </span>
            </div>

            {/* Trending Widget */}
            <div className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] mb-6">
              <div className="px-4 py-3 border-b border-white/[0.05] font-['Kanit'] text-[13px] font-semibold text-white">
                🔥 Trending
              </div>
              <div>
                {related.slice(0, 5).map((item: any, i: number) => (
                  <a
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
                  </a>
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
                <a href="https://www.discord.gg/topgameth" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#AAAAAA] hover:text-[#FF1A1A] transition-colors">Discord</a>
              </div>
            </div>
            <div>
              <div className="font-['Kanit'] text-[13px] font-semibold text-white uppercase tracking-[1px] mb-4">Content</div>
              <div className="flex flex-col gap-2">
                <a href="/news" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">ข่าวสาร</a>
                <a href="/reviews" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">รีวิว</a>
                <a href="/guides" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">เทคนิค</a>
                <a href="/it-gadget" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">IT Gadget</a>
              </div>
            </div>
            <div>
              <div className="font-['Kanit'] text-[13px] font-semibold text-white uppercase tracking-[1px] mb-4">Tools</div>
              <div className="flex flex-col gap-2">
                <a href="/boss" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Boss Timer</a>
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
