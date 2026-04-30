"use client";

import { useState, useEffect } from "react";
import { getArticles, getGames, getArticleBySlug, type Article, type Game } from "@/lib/supabase";

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [arts, gms] = await Promise.all([
          getArticles({ limit: 8 }),
          getGames()
        ]);
        setArticles(arts);
        setGames(gms);
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

  // Placeholder hero if no articles
  const heroArticle = articles[0] || null;
  const trendingArticles = articles.slice(1, 5);
  const mobileArticles = articles.filter(a => {
    const game = a.games;
    return game?.platform === 'mobile' || game?.platform === 'cross-platform';
  }).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-inter">

      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur bg-[#070707]/95 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 h-[58px] flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-[10px] flex-shrink-0">
            <img src="/images/logo.png"
              alt="TopGame Thailand" className="w-8 h-8 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-bold tracking-wide">
                TOP<span className="text-tg-red">GAME</span>
              </span>
              <span className="text-[8px] tracking-[3px] text-white/40 uppercase">Thailand</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-[24px]">
            <a href="/" className="text-[13px] text-white/70 hover:text-white transition-colors">Home</a>
            <a href="/news" className="text-[13px] text-white/70 hover:text-white transition-colors">News</a>
            <a href="/guides" className="text-[13px] text-white/70 hover:text-white transition-colors">Guides</a>
            <a href="/reviews" className="text-[13px] text-white/70 hover:text-white transition-colors">Reviews</a>
            <a href="/it-gadget" className="text-[13px] text-white/70 hover:text-white transition-colors">IT Gadget</a>
            <button onClick={() => scrollToSection("tools")} className="text-[13px] text-tg-red hover:text-tg-red/80 transition-colors">Tools ⚡</button>
          </div>

          {/* Right — Search */}
          <div className="flex items-center gap-[12px]">
            <button
              onClick={() => {
                const s = document.getElementById("search-input");
                if (s) { s.classList.toggle("hidden"); s.focus(); }
              }}
              className="p-[6px] rounded-[6px] hover:bg-white/[0.06] transition-colors"
              aria-label="Search"
            >
              <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path strokeWidth="2" d="m21 21-4.35-4.35" />
              </svg>
            </button>
            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-[6px] rounded-[6px] hover:bg-white/[0.06] transition-colors"
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

        {/* Search Bar */}
        <div id="search-input" className="hidden max-w-7xl mx-auto px-5 pb-[10px]">
          <input
            type="search"
            placeholder="Search articles..."
            className="w-full bg-[#0d0d0d] border border-white/[0.08] rounded-[8px] px-4 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-tg-red/50 transition-colors"
          />
        </div>

        {/* Mobile Menu */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-white/[0.06] bg-[#070707]">
            <div className="max-w-7xl mx-auto px-5 py-[12px] flex flex-col gap-[8px]">
              <a href="/" className="text-[14px] text-white/70 py-[8px]">Home</a>
              <a href="/news" className="text-[14px] text-white/70 py-[8px]">News</a>
              <a href="/guides" className="text-[14px] text-white/70 py-[8px]">Guides</a>
              <a href="/reviews" className="text-[14px] text-white/70 py-[8px]">Reviews</a>
              <a href="/it-gadget" className="text-[14px] text-white/70 py-[8px]">IT Gadget</a>
              <button onClick={() => scrollToSection("tools")} className="text-[14px] text-tg-red text-left py-[8px]">Tools ⚡</button>
            </div>
          </div>
        )}
      </nav>

      {/* ========== HERO — CINEMATIC SPLIT ========== */}
      <div className="max-w-7xl mx-auto px-5 lg:px-0">
      <section className="mt-[58px] grid grid-cols-1 lg:grid-cols-[62%_38%] border-b border-white/[0.05] lg:h-[clamp(280px,42vw,380px)]">

        {/* Left — Main Story */}
        <article className="relative overflow-hidden bg-[#0a0a14] cursor-pointer group min-h-[220px]">
          {/* Background image */}
          <img
            src={heroArticle?.hero_image || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop"}
            alt={heroArticle?.title || "Genshin Impact 5.0"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#070707]/80 via-[#070707]/40 to-[#070707]/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707]/60 via-transparent to-[#070707]/80" />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-end p-[16px_20px_20px]">
            <div className="flex items-center gap-[10px] mb-[8px]">
              <span className={`text-[8px] font-bold tracking-[1.5px] uppercase px-[6px] py-[3px] rounded-[3px] bg-tg-red text-white`}>
                {heroArticle?.category?.toUpperCase() || "FEATURED"}
              </span>
              {heroArticle?.games && (
                <span className="text-[8px] text-white/50 tracking-wider uppercase">
                  {heroArticle.games.name}
                </span>
              )}
            </div>
            <h2 className="font-kanit text-[18px] lg:text-[26px] font-semibold text-white leading-tight line-clamp-2 group-hover:text-tg-red transition-colors">
              {heroArticle?.title || "Welcome to TopGame Thailand"}
            </h2>
            <p className="text-[11px] text-white/40 mt-[6px]">
              {heroArticle?.excerpt || "Your source for mobile game news, reviews, and guides"}
            </p>
          </div>
        </article>

        {/* Right — Latest Sidebar */}
        <div className="border-t lg:border-t-0 lg:border-l border-white/[0.05] bg-[#070707]">
          <div className="p-[14px_16px] border-b border-white/[0.05]">
            <span className="text-[10px] font-bold tracking-[2px] text-white/30 uppercase">Latest</span>
          </div>
          <div className="flex flex-col">
            {articles.slice(1, 5).map((art, i) => (
              <a key={art.id || i} href={`/article/${art.slug}`} className="group flex items-start gap-[12px] p-[12px_16px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[6px] mb-[4px]">
                    <span className={`text-[7px] font-bold tracking-[1.5px] uppercase px-[5px] py-[2px] rounded-[2px] bg-tg-red/80 text-white`}>
                      {art.category?.toUpperCase()}
                    </span>
                    <span className="text-[8px] text-white/30">{art.read_time} min</span>
                  </div>
                  <div className="font-kanit text-[11px] font-semibold text-white/70 leading-[1.3] line-clamp-2 group-hover:text-white transition-colors">
                    {art.title}
                  </div>
                </div>
                {art.hero_image && (
                  <div className="w-[52px] h-[52px] flex-shrink-0 rounded-[6px] overflow-hidden">
                    <img src={art.hero_image} alt={art.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* ========== TRENDING ========== */}
      <section className="max-w-7xl mx-auto px-5 lg:px-0 py-[28px]">
        <div className="flex items-center justify-between mb-[16px]">
          <div className="flex items-center gap-[10px]">
            <span className="text-[18px]">🔥</span>
            <h2 className="font-kanit text-[16px] font-semibold text-white">Trending</h2>
          </div>
          <a href="/trending" className="text-[11px] text-white/30 hover:text-white transition-colors">View All →</a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {trendingArticles.length > 0 ? trendingArticles.map((card, i) => (
            <a key={card.id || i} href={`/article/${card.slug}`} className="bg-[#0d0d0d] rounded-[8px] overflow-hidden cursor-pointer group hover:-translate-y-[2px] transition-transform duration-200">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={card.hero_image || `https://images.unsplash.com/photo-${['1550745165-9bc0b252726f','1612287230202-1ff1d85d1bdf','1560253023-3ec5d502959f','1606144042614-b2417e99c4e3'][i]}?w=400&h=250&fit=crop`} alt={card.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 to-transparent" />
              </div>
              <div className="p-[10px_12px_12px]">
                <div className={`text-[8px] font-bold tracking-[1.5px] uppercase mb-[5px] text-tg-red`}>{card.category?.toUpperCase()}</div>
                <div className="font-kanit text-[11px] font-semibold text-white/70 leading-[1.4] line-clamp-2 group-hover:text-white transition-colors">{card.title}</div>
                <div className="text-[9px] text-white/20 mt-[6px]">{card.read_time} min read</div>
              </div>
            </a>
          )) : (
            // Placeholder cards
            [1,2,3,4].map((i) => (
              <div key={i} className="bg-[#0d0d0d] rounded-[8px] overflow-hidden">
                <div className="aspect-[16/10] bg-[#111]" />
                <div className="p-[10px_12px_12px]">
                  <div className="h-[8px] w-[40px] bg-[#1a1a1a] rounded mb-[8px]" />
                  <div className="h-[14px] bg-[#1a1a1a] rounded w-3/4 mb-[6px]" />
                  <div className="h-[10px] bg-[#111] rounded w-1/2" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========== MOBILE GAMES ========== */}
      <section className="max-w-7xl mx-auto px-5 lg:px-0 py-[28px]">
        <div className="flex items-center justify-between mb-[16px]">
          <div className="flex items-center gap-[10px]">
            <span className="text-[18px]">📱</span>
            <h2 className="font-kanit text-[16px] font-semibold text-white">Mobile Games</h2>
          </div>
          <a href="/mobile" className="text-[11px] text-white/30 hover:text-white transition-colors">View All →</a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
          {mobileArticles.length > 0 ? mobileArticles.map((card, i) => (
            <a key={card.id || i} href={`/article/${card.slug}`} className="bg-[#0d0d0d] rounded-[8px] overflow-hidden cursor-pointer group hover:-translate-y-[2px] transition-transform duration-200">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={card.hero_image || `https://images.unsplash.com/photo-${['1593305841991-05c297ba4575','1542751371-adc38448a05e','1542751110-97427bbecf20','1511512578047-dfb367046420'][i]}?w=400&h=250&fit=crop`} alt={card.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 to-transparent" />
              </div>
              <div className="p-[10px_12px_12px]">
                <div className={`text-[8px] font-bold tracking-[1.5px] uppercase mb-[5px] text-tg-red`}>{card.category?.toUpperCase()}</div>
                <div className="font-kanit text-[11px] font-semibold text-white/70 leading-[1.4] line-clamp-2 group-hover:text-white transition-colors">{card.title}</div>
                <div className="text-[9px] text-white/20 mt-[6px]">{card.read_time} min read</div>
              </div>
            </a>
          )) : (
            [1,2,3,4].map((i) => (
              <div key={i} className="bg-[#0d0d0d] rounded-[8px] overflow-hidden">
                <div className="aspect-[16/10] bg-[#111]" />
                <div className="p-[10px_12px_12px]">
                  <div className="h-[8px] w-[40px] bg-[#1a1a1a] rounded mb-[8px]" />
                  <div className="h-[14px] bg-[#1a1a1a] rounded w-3/4 mb-[6px]" />
                  <div className="h-[10px] bg-[#111] rounded w-1/2" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========== TOOLS ========== */}
      <section id="tools" className="max-w-7xl mx-auto px-5 lg:px-0 py-[28px]">
        <div className="flex items-center gap-[10px] mb-[16px]">
          <span className="text-[18px]">⚡</span>
          <h2 className="font-kanit text-[16px] font-semibold text-white">Tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[10px]">

          {/* Boss Timer */}
          <a href="https://bosstimer.tglabs.info" target="_blank" rel="noopener noreferrer" className="bg-[#0d0d0d] rounded-[8px] p-[16px] cursor-pointer group hover:-translate-y-[1px] transition-all duration-200 border border-white/[0.06] hover:border-tg-red/30">
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-tg-red/10 flex items-center justify-center">
                <img src="https://bosstimer.tglabs.info/logo.png" alt="Boss Timer" className="w-[24px] h-[24px] object-contain" />
              </div>
              <div>
                <div className="font-kanit text-[13px] font-semibold text-white group-hover:text-tg-red transition-colors">TOSM Boss Timer</div>
                <div className="text-[10px] text-white/40 mt-[2px]">Track boss respawns • 54 bosses</div>
              </div>
            </div>
          </a>

          {/* Tier List Builder — placeholder */}
          <div className="bg-[#0d0d0d] rounded-[8px] p-[16px] border border-white/[0.06] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-[#1a1a1a] flex items-center justify-center">
                <span className="text-[18px]">📊</span>
              </div>
              <div>
                <div className="font-kanit text-[13px] font-semibold text-white">Tier List Builder</div>
                <div className="text-[10px] text-white/40 mt-[2px]">Coming soon...</div>
              </div>
            </div>
          </div>

          {/* Code Redeemer — placeholder */}
          <div className="bg-[#0d0d0d] rounded-[8px] p-[16px] border border-white/[0.06] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-[#1a1a1a] flex items-center justify-center">
                <span className="text-[18px]">🎁</span>
              </div>
              <div>
                <div className="font-kanit text-[13px] font-semibold text-white">Code Redeemer</div>
                <div className="text-[10px] text-white/40 mt-[2px]">Coming soon...</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-white/[0.05] mt-[20px]">
        <div className="max-w-7xl mx-auto px-5 lg:px-0 py-[24px]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-[20px]">

            {/* Logo + Nav */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[10px]">
                <img src="/images/logo.png" alt="TopGame Thailand" className="w-6 h-6 object-contain" />
                <span className="text-[12px] font-bold tracking-wide">TOP<span className="text-tg-red">GAME</span> Thailand</span>
              </div>
              <div className="flex flex-wrap gap-[16px]">
                <a href="/news" className="text-[11px] text-white/40 hover:text-white transition-colors">News</a>
                <a href="/reviews" className="text-[11px] text-white/40 hover:text-white transition-colors">Reviews</a>
                <a href="/guides" className="text-[11px] text-white/40 hover:text-white transition-colors">Guides</a>
                <a href="/it-gadget" className="text-[11px] text-white/40 hover:text-white transition-colors">IT Gadget</a>
              </div>
            </div>

            {/* Follow */}
            <div className="flex flex-col gap-[8px]">
              <span className="text-[10px] tracking-[2px] text-white/30 uppercase">Follow</span>
              <div className="flex gap-[12px]">
                <a href="https://www.youtube.com/@topgame_th" target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/40 hover:text-white transition-colors">YouTube</a>
                <a href="https://www.facebook.com/topgameth" target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/40 hover:text-white transition-colors">Facebook</a>
                <a href="https://discord.gg/topgameth" target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/40 hover:text-white transition-colors">Discord</a>
              </div>
            </div>

          </div>
          <div className="mt-[20px] pt-[16px] border-t border-white/[0.05] text-center">
            <span className="text-[10px] text-white/20">© 2026 TopGame Thailand. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
