"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getArticles, getGames, type Article, type Game } from "@/lib/supabase";

// Category badge colors
const categoryColors: Record<string, string> = {
  tips: "bg-[#FF1A1A] text-white shadow-[0_0_20px_rgba(255,26,26,0.4)]",
  live: "bg-[#FF6B35] text-white",
  news: "bg-[#4A90D9] text-white",
  review: "bg-[#4DCC8A] text-white",
  tech: "bg-[#A855F7] text-white",
  tournament: "bg-[#FFD700] text-black",
};

function getCategoryBadge(category: string | null | undefined, className = "") {
  const c = (category || "news").toLowerCase();
  const colorClass = categoryColors[c] || categoryColors.news;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold tracking-[1.5px] uppercase ${colorClass} ${className}`}>
      {c === "tips" && "🔥 "}
      {c === "live" && "📺 "}
      {c === "news" && "📰 "}
      {c === "review" && "🎮 "}
      {c === "tech" && "💻 "}
      {c === "tournament" && "🏆 "}
      {c}
    </span>
  );
}

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [arts, gms] = await Promise.all([
          getArticles({ limit: 9 }),
          getGames()
        ]);
        setArticles(arts || []);
        setGames(gms || []);
      } catch (e) {
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileNavOpen(false);
    }
  };

  const heroArticle = articles[0] || null;
  const latestArticles = articles.slice(1, 5);
  const trendingArticles = articles.slice(1, 5);
  const mobileArticles = articles.filter(a => a.category?.toLowerCase() === "mobile").slice(0, 4);

  // Coming Soon Toast
  useEffect(() => {
    if (comingSoon) {
      const t = setTimeout(() => setComingSoon(false), 2500);
      return () => clearTimeout(t);
    }
  }, [comingSoon]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#E8E8E8] font-sans">

      {/* ========== NAVBAR ========== */}
      <nav className="sticky top-0 z-[100] bg-[rgba(0,0,0,0.95)] backdrop-blur-[12px] border-b border-white/[0.06] h-[64px]">
        <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-[10px] flex-shrink-0">
            <img
              src="https://www.tglabs.info/images/logo.png"
              alt="TopGame Thailand"
              className="w-9 h-9 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="flex flex-col leading-none">
              <span className="font-['Bebas_Neue'] text-[18px] tracking-[2px] text-white">
                TOP<span className="text-[#FF1A1A]">GAME</span>
              </span>
              <span className="text-[8px] tracking-[3px] text-white/[0.4] uppercase">Thailand</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Home</Link>
            <Link href="/news" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">News</Link>
            <Link href="/news/mobile" className="text-[13px] text-white/[0.7] hover:text-white transition-colors">Mobile</Link>
            <button onClick={() => setComingSoon(true)} className="text-[13px] text-white/[0.7] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0">Guides</button>
            <button onClick={() => setComingSoon(true)} className="text-[13px] text-white/[0.7] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0">Reviews</button>
            <button onClick={() => setComingSoon(true)} className="text-[13px] text-white/[0.7] hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0">IT Gadget</button>
            <a href="#tools" className="text-[13px] text-[#FF1A1A] hover:text-[#FF1A1A]/80 transition-colors">Tools ⚡</a>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-md hover:bg-white/[0.06] transition-colors"
              aria-label="Search"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeWidth="2" d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              className="lg:hidden p-2 rounded-md hover:bg-white/[0.06] transition-colors"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Menu"
            >
              <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileNavOpen ? (
                  <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t border-white/[0.06] px-4 pb-3">
            <input
              type="search"
              placeholder="Search articles..."
              className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-lg px-4 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1A1A]/50 transition-colors"
            />
          </div>
        )}

        {/* Mobile Menu */}
          {mobileNavOpen && (
            <div className="lg:hidden border-t border-white/[0.06] bg-[#000000]">
              <div className="max-w-[1280px] mx-auto px-4 py-3 flex flex-col gap-1">
                <Link href="/" className="text-[14px] text-white py-2">Home</Link>
                <Link href="/news" className="text-[14px] text-white py-2">News</Link>
                <Link href="/news/mobile" className="text-[14px] text-white py-2">Mobile</Link>
                <button onClick={() => setComingSoon(true)} className="text-[14px] text-white py-2 text-left cursor-pointer bg-transparent border-none p-0">Guides</button>
                <button onClick={() => setComingSoon(true)} className="text-[14px] text-white py-2 text-left cursor-pointer bg-transparent border-none p-0">Reviews</button>
                <button onClick={() => setComingSoon(true)} className="text-[14px] text-white py-2 text-left cursor-pointer bg-transparent border-none p-0">IT Gadget</button>
                <a href="#tools" className="text-[14px] text-[#FF1A1A] py-2">Tools ⚡</a>
              </div>
            </div>
          )}
        </nav>

      <div className="max-w-[1280px] mx-auto px-4">

        {/* ========== AD: HEADER BANNER ========== */}
        <div className="h-[70px] mb-4 flex items-center justify-center bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
          <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 728×90 </span>
        </div>

        {/* ========== HERO SECTION ========== */}
        <section className="mt-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">

          {/* Main Hero Card */}
          <a
            href={heroArticle ? `/news/${heroArticle.slug}` : "/news"}
            className="relative overflow-hidden rounded-xl cursor-pointer group min-h-[280px] aspect-[16/9] block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] to-[#070707]" />
            {!loading && heroArticle?.hero_image ? (
              <img
                src={heroArticle.hero_image}
                alt={heroArticle.title || "Featured"}
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="absolute inset-0 bg-[#1A1A1A] animate-pulse" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/[0.6] via-black/[0.2] to-black/[0.05]" />
            <div className="relative z-10 h-full flex flex-col justify-end p-6">
              <div className="mb-2">
                {loading ? (
                  <div className="h-[22px] w-[60px] bg-[#1A1A1A] rounded animate-pulse" />
                ) : (
                  getCategoryBadge(heroArticle?.category)
                )}
              </div>
              {loading ? (
                <>
                  <div className="h-[28px] bg-[#1A1A1A] rounded w-full mb-2 animate-pulse" />
                  <div className="h-[16px] bg-[#1A1A1A] rounded w-3/4 animate-pulse" />
                </>
              ) : (
                <>
                  <h2 className="font-['Kanit'] text-[22px] lg:text-[26px] font-semibold text-white leading-tight line-clamp-2 group-hover:text-[#FF1A1A] transition-colors">
                    {heroArticle?.title || "Welcome to TopGame Thailand"}
                  </h2>
                  <p className="text-[13px] text-white/[0.5] mt-2">
                    {heroArticle?.excerpt || "แหล่งรวมข่าวเกมมือถือ รีวิว และเทคนิค อัปเดตล่าสุด"}
                  </p>
                </>
              )}
            </div>
          </a>

          {/* Latest Sidebar */}
          <div className="bg-[#0D0D0D] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.05]">
              <span className="text-[11px] font-bold tracking-[2px] text-white/[0.3] uppercase">📺 Latest Updates</span>
            </div>
            <div className="flex flex-col">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 p-3 border-b border-white/[0.03] animate-pulse">
                    <div className="w-[80px] h-[50px] rounded-md bg-[#1A1A1A]" />
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="h-[14px] bg-[#1A1A1A] rounded w-3/4" />
                      <div className="h-[10px] bg-[#1A1A1A] rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : latestArticles.length > 0 ? latestArticles.map((art, i) => (
                <a
                  key={art.id || i}
                  href={`/news/${art.slug}`}
                  className="flex gap-3 p-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-[80px] h-[50px] rounded-md overflow-hidden flex-shrink-0 bg-[#1A1A1A]">
                    {art.hero_image ? (
                      <img src={art.hero_image} alt={art.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1A1A1A]" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="mb-1">{getCategoryBadge(art.category)}</div>
                    <div className="font-['Kanit'] text-[13px] font-medium text-white leading-[1.3] line-clamp-2">
                      {art.title}
                    </div>
                  </div>
                </a>
              )) : (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 p-3 border-b border-white/[0.03]">
                    <div className="w-[80px] h-[50px] rounded-md bg-[#1A1A1A]" />
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="h-[14px] bg-[#1A1A1A] rounded w-3/4" />
                      <div className="h-[10px] bg-[#1A1A1A] rounded w-1/2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ========== MAIN LAYOUT (Content + Sidebar) ========== */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          <div className="min-w-0">

            {/* ========== TRENDING ========== */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">🔥</span>
                  <h2 className="font-['Kanit'] text-[18px] font-semibold text-white">Trending</h2>
                </div>
                <Link href="/trending" className="text-[12px] text-white/[0.3] hover:text-white transition-colors">View All →</Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#0D0D0D] rounded-[10px] overflow-hidden animate-pulse">
                      <div className="aspect-[16/9] bg-[#1A1A1A]" />
                      <div className="p-3">
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/2 mb-3" />
                        <div className="h-[14px] bg-[#1A1A1A] rounded w-3/4 mb-2" />
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/3" />
                      </div>
                    </div>
                  ))
                ) : trendingArticles.length > 0 ? trendingArticles.map((card, i) => (
                  <Link
                    key={card.id || i}
                    href={`/news/${card.slug}`}
                    className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] cursor-pointer group hover:-translate-y-[4px] hover:border-[#FF1A1A]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300"
                  >
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {card.hero_image ? (
                        <img
                          src={card.hero_image}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1A1A1A]" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] font-bold tracking-[1px] uppercase text-[#FF1A1A] mb-2">{card.category?.toUpperCase()}</div>
                      <div className="font-['Kanit'] text-[14px] font-medium text-white leading-[1.4] line-clamp-2 group-hover:text-white transition-colors">{card.title}</div>
                      <div className="text-[11px] text-[#AAAAAA] mt-2">{card.read_time || 3} min read</div>
                    </div>
                  </Link>
                )) : (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#0D0D0D] rounded-[10px] overflow-hidden">
                      <div className="aspect-[16/9] bg-[#1A1A1A]" />
                      <div className="p-3">
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/2 mb-3" />
                        <div className="h-[14px] bg-[#1A1A1A] rounded w-3/4 mb-2" />
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/3" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ========== MOBILE GAMES ========== */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">📱</span>
                  <h2 className="font-['Kanit'] text-[18px] font-semibold text-white">Mobile Games</h2>
                </div>
                <Link href="/mobile" className="text-[12px] text-white/[0.3] hover:text-white transition-colors">View All →</Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#0D0D0D] rounded-[10px] overflow-hidden animate-pulse">
                      <div className="aspect-[16/9] bg-[#1A1A1A]" />
                      <div className="p-3">
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/2 mb-3" />
                        <div className="h-[14px] bg-[#1A1A1A] rounded w-3/4 mb-2" />
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/3" />
                      </div>
                    </div>
                  ))
                ) : mobileArticles.length > 0 ? mobileArticles.map((card, i) => (
                  <Link
                    key={card.id || i}
                    href={`/news/${card.slug}`}
                    className="bg-[#0D0D0D] rounded-[10px] overflow-hidden border border-white/[0.04] cursor-pointer group hover:-translate-y-[4px] hover:border-[#FF1A1A]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-300"
                  >
                    <div className="aspect-[16/9] relative overflow-hidden">
                      {card.hero_image ? (
                        <img
                          src={card.hero_image}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1A1A1A]" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] font-bold tracking-[1px] uppercase text-[#FF1A1A] mb-2">{card.category?.toUpperCase()}</div>
                      <div className="font-['Kanit'] text-[14px] font-medium text-white leading-[1.4] line-clamp-2 group-hover:text-white transition-colors">{card.title}</div>
                      <div className="text-[11px] text-[#AAAAAA] mt-2">{card.read_time || 3} min read</div>
                    </div>
                  </Link>
                )) : (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#0D0D0D] rounded-[10px] overflow-hidden">
                      <div className="aspect-[16/9] bg-[#1A1A1A]" />
                      <div className="p-3">
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/2 mb-3" />
                        <div className="h-[14px] bg-[#1A1A1A] rounded w-3/4 mb-2" />
                        <div className="h-[10px] bg-[#1A1A1A] rounded w-1/3" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ========== AD: SECTION BREAK ========== */}
            <div className="h-[120px] my-12 flex items-center justify-center bg-gradient-to-r from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 728×120 </span>
            </div>

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
                🔥 Trending
              </div>
              <div>
                {trendingArticles.slice(0, 5).map((item, i) => (
                  <Link
                    key={item.id || i}
                    href={`/news/${item.slug}`}
                    className="flex gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
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
                  { name: "🎮 Reviews", href: "/reviews", count: "89" },
                  { name: "🔥 Tips & Tricks", href: "/guides", count: "156" },
                  { name: "💻 IT Gadget", href: "/it-gadget", count: "43" },
                  { name: "🏆 Tournament", href: "/tournament", count: "67" },
                ].map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="flex justify-between py-2 border-b border-white/[0.05] text-[13px] text-[#AAAAAA] last:border-0 hover:text-white transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[#666666]">{cat.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* AD Tall */}
            <div className="min-h-[300px] flex items-center justify-center bg-gradient-to-br from-[#0D0D0D] to-[#1A1A1A] border border-dashed border-[#2A2A2A] rounded-lg">
              <span className="text-[12px] tracking-[1px] text-[#666666] uppercase"> advertisement — 300×600 </span>
            </div>

          </aside>
        </div>

        {/* ========== TOOLS SECTION ========== */}
        <section id="tools" className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[20px]">⚡</span>
            <h2 className="font-['Kanit'] text-[18px] font-semibold text-white">Tools</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Boss Timer */}
            <a
              href="https://bosstimer.tglabs.info/"
              className="bg-[#0D0D0D] rounded-[10px] p-4 border border-white/[0.06] cursor-pointer group hover:-translate-y-[2px] hover:border-[#FF1A1A]/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-[44px] h-[44px] rounded-[10px] bg-[rgba(255,26,26,0.1)] flex items-center justify-center group-hover:bg-[rgba(255,26,26,0.15)] transition-colors">
                  <span className="text-[20px]">⚔️</span>
                </div>
                <div>
                  <div className="font-['Kanit'] text-[14px] font-semibold text-white group-hover:text-[#FF1A1A] transition-colors">TOSM Boss Timer</div>
                  <div className="text-[12px] text-[#AAAAAA] mt-1">Track boss respawns • 54 bosses</div>
                </div>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-[0.5px] bg-[rgba(255,26,26,0.15)] text-[#FF1A1A]">LIVE</span>
              </div>
            </a>

            {/* Tier List Builder — placeholder */}
            <div className="bg-[#0D0D0D] rounded-[10px] p-4 border border-white/[0.06] opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="w-[44px] h-[44px] rounded-[10px] bg-[#1A1A1A] flex items-center justify-center">
                  <span className="text-[20px]">📊</span>
                </div>
                <div>
                  <div className="font-['Kanit'] text-[14px] font-semibold text-white">Tier List Builder</div>
                  <div className="text-[12px] text-[#AAAAAA] mt-1">Coming soon...</div>
                </div>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-[0.5px] bg-white/[0.08] text-[#AAAAAA]">SOON</span>
              </div>
            </div>

            {/* Code Redeemer — placeholder */}
            <div className="bg-[#0D0D0D] rounded-[10px] p-4 border border-white/[0.06] opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="w-[44px] h-[44px] rounded-[10px] bg-[#1A1A1A] flex items-center justify-center">
                  <span className="text-[20px]">🎁</span>
                </div>
                <div>
                  <div className="font-['Kanit'] text-[14px] font-semibold text-white">Code Redeemer</div>
                  <div className="text-[12px] text-[#AAAAAA] mt-1">Coming soon...</div>
                </div>
              </div>
              <div className="mt-3">
                <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-[0.5px] bg-white/[0.08] text-[#AAAAAA]">SOON</span>
              </div>
            </div>

          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer className="mt-12 py-8 border-t border-white/[0.05]">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8">

            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://www.tglabs.info/images/logo.png"
                  alt="TopGame Thailand"
                  className="w-7 h-7 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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

            {/* Content Links */}
            <div>
              <div className="font-['Kanit'] text-[13px] font-semibold text-white uppercase tracking-[1px] mb-4">Content</div>
              <div className="flex flex-col gap-2">
                <Link href="/news" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">ข่าวสาร</Link>
                <Link href="/reviews" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">รีวิว</Link>
                <Link href="/guides" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">เทคนิค</Link>
                <Link href="/it-gadget" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">IT Gadget</Link>
              </div>
            </div>

            {/* Tools Links */}
            <div>
              <div className="font-['Kanit'] text-[13px] font-semibold text-white uppercase tracking-[1px] mb-4">Tools</div>
              <div className="flex flex-col gap-2">
                <a href="https://bosstimer.tglabs.info/" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Boss Timer</a>
                <Link href="/tierlist" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Tier List</Link>
                <Link href="/codes" className="text-[13px] text-[#AAAAAA] hover:text-white transition-colors">Codes</Link>
              </div>
            </div>

          </div>

          {/* Glow Bar */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FF1A1A] to-transparent my-6" />

          <div className="text-center">
            <span className="text-[12px] text-white/[0.2]">© 2026 TopGame Thailand. All rights reserved.</span>
          </div>
        </footer>

        {/* Coming Soon Toast */}
        {comingSoon && (
          <div
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              zIndex: 99999, background: "rgba(10,10,10,0.98)", border: "1px solid #FF1A1A",
              borderRadius: 12, padding: "24px 48px", boxShadow: "0 0 60px rgba(255,26,26,0.5)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
              <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: 22, color: "#fff", fontWeight: 600, letterSpacing: 1 }}>
                Coming Soon..
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>ฟีเจอร์นี้กำลังพัฒนา</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
