"use client";

import { useState } from "react";

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileNavOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-inter">

      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur bg-[#070707]/95 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 h-[58px] flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-[10px] flex-shrink-0">
            <img src="/images/logo.png" alt="TopGame Thailand" className="w-8 h-8 object-contain" />
            <div className="flex flex-col leading-none">
              <div className="font-kanit text-[14px] font-black tracking-[0.5px] text-white">
                TOP<span className="text-tg-red">GAME</span>
              </div>
              <div className="font-inter text-[8px] font-medium tracking-[3px] uppercase text-white/30 mt-[1px]">
                Thailand
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-[2px]">
            {["Home", "News", "Guides", "Reviews", "IT Gadget"].map((item, i) => (
              <a
                key={item}
                href="#"
                className={`text-[12px] font-medium px-[13px] py-[6px] rounded-[5px] transition-all duration-150 ${
                  i === 0
                    ? "text-white bg-white/[0.06]"
                    : "text-white/45 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {item}
              </a>
            ))}
            <button
              onClick={() => scrollToSection("tools")}
              className="ml-1 text-[10px] font-semibold px-3 py-[5px] rounded-full bg-tg-red/15 text-tg-red border border-tg-red/25 tracking-[0.5px] hover:bg-tg-red/25 transition-all cursor-pointer"
            >
              Tools ⚡
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-[6px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/10 transition-all">
              <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden w-7 h-7 flex items-center justify-center text-white/40"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-[#070707]/98 border-t border-white/[0.06] px-5 py-4 flex flex-col gap-1">
            {["Home", "News", "Guides", "Reviews", "IT Gadget"].map((item, i) => (
              <a
                key={item}
                href="#"
                className={`px-3 py-2 rounded-[5px] text-sm font-medium transition-all ${
                  i === 0 ? "text-white bg-white/[0.06]" : "text-white/45 hover:text-white"
                }`}
              >
                {item}
              </a>
            ))}
            <button onClick={() => scrollToSection("tools")} className="mt-2 px-3 py-2 rounded-full text-center text-[11px] font-semibold bg-tg-red/15 text-tg-red border border-tg-red/25 cursor-pointer">
              Tools ⚡
            </button>
          </div>
        )}
      </nav>

      {/* ========== HERO — CINEMATIC SPLIT ========== */}
      <div className="max-w-7xl mx-auto px-5 lg:px-0">
      <section className="mt-[58px] grid grid-cols-1 lg:grid-cols-[62%_38%] border-b border-white/[0.05] lg:h-[clamp(280px,42vw,380px)]">

        {/* Left — Main Story */}
        <article className="relative overflow-hidden bg-[#0a0a14] cursor-pointer group min-h-[220px]">
          {/*           {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=600&fit=crop"
            alt="Genshin Impact 5.0"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#070707]/80 via-[#070707]/40 to-[#070707]/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707]/60 via-transparent to-[#070707]/80" />     {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#070707] opacity-100 lg:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707]/97 via-[#070707]/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-7">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[6px] h-[6px] rounded-full bg-tg-red animate-pulse" />
              <span className="text-[9px] font-bold tracking-[3px] uppercase text-tg-red">Live Review</span>
            </div>
            <h1 className="font-kanit text-[18px] lg:text-[26px] font-black text-white leading-[1.2] mb-3 max-w-[420px] group-hover:text-tg-red/90 transition-colors">
              Genshin Impact 5.0 — The Biggest Update SEA Gamers Can&apos;t Miss
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/35">TopGame Thailand</span>
              <span className="w-px h-[10px] bg-white/10" />
              <span className="text-[11px] text-white/25">Apr 30, 2026</span>
              <span className="ml-auto text-[10px] font-semibold text-tg-red tracking-[1px] uppercase hidden sm:block">Read More →</span>
            </div>
          </div>
        </article>

        {/* Right — Latest Sidebar */}
        <aside className="bg-[#050505] border-t lg:border-t-0 lg:border-l border-white/[0.04] flex flex-col lg:max-h-[380px] lg:overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
            <span className="text-[9px] font-bold tracking-[3px] uppercase text-white/20">Latest</span>
            <span className="text-[9px] font-semibold text-tg-red tracking-[0.5px]">See all →</span>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {[
              { num: "01", tag: "Review", tagColor: "text-tg-red", title: "Elden Ring: Nightreign — Full Review, Best Spin-off Yet?", time: "2h ago" },
              { num: "02", tag: "News", tagColor: "text-tg-news", title: "Pokemon TCG Pocket Launches Today — Free Download Available", time: "4h ago" },
              { num: "03", tag: "Tips", tagColor: "text-tg-review", title: "10 Tricks to Save Primogems in Genshin Impact", time: "6h ago" },
              { num: "04", tag: "Mobile", tagColor: "text-tg-live", title: "Honor of Kings SEA — New Season Patch Notes", time: "8h ago" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex gap-3 px-5 py-3 border-b border-white/[0.03] last:border-b-0 cursor-pointer hover:bg-white/[0.02] transition-all group"
              >
                <div className="font-bebas text-[18px] text-white/[0.07] leading-none flex-shrink-0 w-5 mt-[1px]">
                  {item.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[8px] font-bold tracking-[1.5px] uppercase mb-1 ${item.tagColor}`}>
                    {item.tag}
                  </div>
                  <div className="font-kanit text-[11px] font-semibold text-white/60 leading-[1.4] line-clamp-2 group-hover:text-white/80 transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[9px] text-white/20 mt-1">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-5 py-6 lg:py-8">

        {/* TRENDING */}
        <section className="pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-4 bg-tg-red rounded-full" />
              <h2 className="font-kanit text-[15px] font-bold uppercase tracking-wide">Trending</h2>
            </div>
            <span className="text-[10px] text-white/25 hover:text-tg-red transition-colors cursor-pointer tracking-[0.5px]">See all →</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
            {[
              { img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=250&fit=crop", tag: "Review", tagClass: "text-tg-red", title: "Elden Ring Nightreign — Full Review", meta: "Apr 27 · 8 min" },
              { img: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=250&fit=crop", tag: "Live", tagClass: "text-tg-live", title: "Pokemon Presents Recap — Everything Announced", meta: "Apr 26 · 5 min" },
              { img: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&h=250&fit=crop", tag: "News", tagClass: "text-tg-news", title: "Honor of Kings SEA New Season Is Live", meta: "Apr 25 · 3 min" },
              { img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=250&fit=crop", tag: "Guide", tagClass: "text-tg-review", title: "Zenless Zone Zero Beginner's Guide 2026", meta: "Apr 24 · 12 min" },
            ].map((card, i) => (
              <article key={i} className="bg-[#0d0d0d] rounded-[8px] overflow-hidden cursor-pointer group hover:-translate-y-[2px] transition-transform duration-200">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 to-transparent" />
                </div>
                <div className="p-[10px_12px_12px]">
                  <div className={`text-[8px] font-bold tracking-[1.5px] uppercase mb-[5px] ${card.tagClass}`}>{card.tag}</div>
                  <div className="font-kanit text-[11px] font-semibold text-white/70 leading-[1.4] line-clamp-2 group-hover:text-white transition-colors">{card.title}</div>
                  <div className="text-[9px] text-white/20 mt-[6px]">{card.meta}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* MOBILE GAMES */}
        <section className="pt-5 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-4 bg-tg-red rounded-full" />
              <h2 className="font-kanit text-[15px] font-bold uppercase tracking-wide">Mobile Games</h2>
            </div>
            <span className="text-[10px] text-white/25 hover:text-tg-red transition-colors cursor-pointer tracking-[0.5px]">See all →</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[10px]">
            {[
              { img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&h=250&fit=crop", tag: "Tips", tagClass: "text-tg-red", title: "Genshin Impact 5.1 — Best Team Comps SEA", meta: "Apr 23 · 7 min" },
              { img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop", tag: "Esports", tagClass: "text-tg-live", title: "Honor of Kings World Championship — SEA Results", meta: "Apr 22 · 4 min" },
              { img: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400&h=250&fit=crop", tag: "Guide", tagClass: "text-tg-review", title: "Wuthering Waves Tier List — Best Characters Apr 2026", meta: "Apr 21 · 9 min" },
              { img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop", tag: "Reroll", tagClass: "text-tg-tech", title: "AFK Journey Reroll Guide — Get SSR on First Pull", meta: "Apr 20 · 6 min" },
            ].map((card, i) => (
              <article key={i} className="bg-[#0d0d0d] rounded-[8px] overflow-hidden cursor-pointer group hover:-translate-y-[2px] transition-transform duration-200">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d]/80 to-transparent" />
                </div>
                <div className="p-[10px_12px_12px]">
                  <div className={`text-[8px] font-bold tracking-[1.5px] uppercase mb-[5px] ${card.tagClass}`}>{card.tag}</div>
                  <div className="font-kanit text-[11px] font-semibold text-white/70 leading-[1.4] line-clamp-2 group-hover:text-white transition-colors">{card.title}</div>
                  <div className="text-[9px] text-white/20 mt-[6px]">{card.meta}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* TOOLS */}
        <section id="tools" className="pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-4 bg-tg-red rounded-full" />
              <h2 className="font-kanit text-[15px] font-bold uppercase tracking-wide">Tools</h2>
            </div>
            <span className="text-[10px] text-white/25 hover:text-tg-red transition-colors cursor-pointer tracking-[0.5px]">See all →</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[10px]">
            <a
              href="https://bosstimer.tglabs.info"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0d0d0d] rounded-[8px] p-4 flex items-center gap-3 cursor-pointer border border-white/[0.04] hover:border-tg-red/20 transition-all group"
            >
              <div className="w-9 h-9 rounded-[8px] bg-tg-red/[0.12] flex items-center justify-center text-base flex-shrink-0">
                <img src="https://bosstimer.tglabs.info/logo.png" alt="TOSM" className="w-9 h-9 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-kanit text-[12px] font-bold text-white">TOSM Boss Timer</div>
                <div className="text-[9px] text-white/30 mt-[2px]">Spawn alerts for Genshin, HSR & more</div>
              </div>
              <div className="text-white/15 group-hover:text-tg-red transition-colors text-sm">→</div>
            </a>
            <div className="bg-[#0d0d0d] rounded-[8px] p-4 flex items-center gap-3 cursor-pointer border border-white/[0.04] hover:border-tg-news/20 transition-all group">
              <div className="w-9 h-9 rounded-[8px] bg-tg-news/[0.12] flex items-center justify-center text-base flex-shrink-0">
                📊
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-kanit text-[12px] font-bold text-white">Tier List Builder</div>
                <div className="text-[9px] text-white/30 mt-[2px]">Build & share interactive tier lists</div>
              </div>
              <div className="text-white/15 group-hover:text-tg-news transition-colors text-sm">→</div>
            </div>
            <div className="bg-[#0d0d0d] rounded-[8px] p-4 flex items-center gap-3 cursor-pointer border border-white/[0.04] hover:border-tg-review/20 transition-all group">
              <div className="w-9 h-9 rounded-[8px] bg-tg-review/[0.12] flex items-center justify-center text-base flex-shrink-0">
                🎁
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-kanit text-[12px] font-bold text-white">Code Redeemer</div>
                <div className="text-[9px] text-white/30 mt-[2px]">All active redeem codes in one place</div>
              </div>
              <div className="text-white/15 group-hover:text-tg-review transition-colors text-sm">→</div>
            </div>
          </div>
        </section>

      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[#040404] border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-6 mb-5">
            <div>
              <div className="font-kanit text-[16px] font-black text-white mb-1">
                TOP<span className="text-tg-red">GAME</span> Thailand
              </div>
              <div className="text-[10px] text-white/20 leading-[1.7]">
                Your #1 source for mobile gaming news,<br />
                guides, and reviews across Southeast Asia.
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-3">Navigate</div>
              <div className="flex flex-col gap-[6px]">
                {["Home", "News", "Guides", "Reviews", "Tools"].map(link => (
                  <a key={link} href="#" className="text-[11px] text-white/30 hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-3">Follow</div>
              <div className="flex flex-col gap-[6px]">
                {["YouTube", "Facebook", "Discord", "X / Twitter"].map(link => (
                  <a key={link} href="#" className="text-[11px] text-white/30 hover:text-white transition-colors">{link}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-4 text-center text-[9px] text-white/12">
            &copy; 2026 TopGame Thailand &middot; All rights reserved
          </div>
        </div>
      </footer>

    </div>
  );
}
