"use client";

import { useState } from "react";

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Prompt',sans-serif]">

      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A]/90 nav-blur border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 24C8 15.163 15.163 8 24 8s16 7.163 16 16" stroke="#FF1A1A" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <rect x="4" y="22" width="8" height="14" rx="3" fill="#FF1A1A"/>
                <rect x="36" y="22" width="8" height="14" rx="3" fill="#FF1A1A"/>
                <rect x="14" y="26" width="20" height="14" rx="4" fill="#FF1A1A"/>
                <path d="M24 14c0-3 2-5 4-7-1 2-1 4-1 6 0 2 1 3 2 4-2-1-4-1-5-1v-2z" fill="#FF1A1A"/>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-0">
                <span className="font-['Bebas_Neue'] text-2xl tracking-wider text-white italic">TOP</span>
                <span className="font-['Bebas_Neue'] text-2xl tracking-wider text-[#FF1A1A] italic">GAME</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-px w-4 bg-[#FF1A1A]"></div>
                <span className="font-['Inter'] text-[10px] text-[#FF1A1A] tracking-[0.2em] uppercase font-medium">Thailand</span>
                <div className="h-px w-4 bg-[#FF1A1A]"></div>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <a href="#" className="px-4 py-2 text-sm font-medium text-white hover:text-[#FF1A1A] transition-colors rounded-lg hover:bg-[#1F1F1F]">หน้าแรก</a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-[#CFCFCF] hover:text-[#FF1A1A] transition-colors rounded-lg hover:bg-[#1F1F1F]">ข่าวเกม</a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-[#CFCFCF] hover:text-[#FF1A1A] transition-colors rounded-lg hover:bg-[#1F1F1F]">วิธีเล่น</a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-[#CFCFCF] hover:text-[#FF1A1A] transition-colors rounded-lg hover:bg-[#1F1F1F]">รีวิว</a>
            <a href="#" className="px-4 py-2 text-sm font-medium text-[#CFCFCF] hover:text-[#FF1A1A] transition-colors rounded-lg hover:bg-[#1F1F1F]">IT Gadget</a>
          </div>

          {/* Search & Mobile Menu */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-[#CFCFCF] hover:text-[#FF1A1A] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="lg:hidden p-2 text-[#CFCFCF]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Dropdown */}
      {mobileNavOpen && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-[#0A0A0A]/95 nav-blur border-b border-[#2A2A2A] lg:hidden px-4 py-4 flex flex-col gap-4">
          <a href="#" className="text-white font-medium hover:text-[#FF1A1A] transition-colors">หน้าแรก</a>
          <a href="#" className="text-[#CFCFCF] font-medium hover:text-[#FF1A1A] transition-colors">ข่าวเกม</a>
          <a href="#" className="text-[#CFCFCF] font-medium hover:text-[#FF1A1A] transition-colors">วิธีเล่น</a>
          <a href="#" className="text-[#CFCFCF] font-medium hover:text-[#FF1A1A] transition-colors">รีวิว</a>
          <a href="#" className="text-[#CFCFCF] font-medium hover:text-[#FF1A1A] transition-colors">IT Gadget</a>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-10">

        {/* ========== HERO + LATEST SECTION ========== */}
        <section className="flex flex-col lg:flex-row gap-6 mb-10 lg:items-center">

          {/* ===== HERO (2/3 width) ===== */}
          <article className="lg:w-[calc(66.67%-12px)] cursor-pointer">
            <div className="relative rounded-lg overflow-hidden minimal-card">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200&h=750&fit=crop"
                  className="w-full h-full object-cover card-img"
                  alt="Genshin Impact 5.0"
                />
              </div>
              <div className="absolute inset-0 hero-overlay"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block bg-[#FF1A1A] text-white text-xs font-bold px-3 py-1 rounded mb-3 uppercase tracking-wide">
                  🔥 Live Review
                </span>
                <h2 className="font-['Kanit'] text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                  Genshin Impact 5.0 อัปเดตใหญ่! ฟีเจอร์ใหม่ที่ห้ามพลาด
                </h2>
                <p className="text-[#CFCFCF] text-sm">โดย TopGame Thailand • 27 เมษายน 2569</p>
              </div>
            </div>
          </article>

          {/* ===== LATEST SIDEBAR (1/3 width) ===== */}
          <aside className="lg:w-[calc(33.33%-12px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">ล่าสุด</h2>
              <a href="#" className="text-[#FF1A1A] text-sm font-medium hover:underline">ดูทั้งหมด →</a>
            </div>
            <div className="bg-[#1F1F1F] rounded-lg p-4">
              {/* Item 1 */}
              <div className="latest-item">
                <div className="flex gap-3 cursor-pointer">
                  <div className="flex-1">
                    <span className="text-[#FF1A1A] text-xs font-bold uppercase">🔥 Tips</span>
                    <h3 className="latest-title text-white font-medium mt-1 line-clamp-2">
                      10 ทริคโกงมิตรภาพใน Stardust Valley ฉบับรวดเร็ว
                    </h3>
                  </div>
                  <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1493238792000-8113da705763?w=200&h=140&fit=crop" className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
              </div>
              {/* Item 2 */}
              <div className="latest-item">
                <div className="flex gap-3 cursor-pointer">
                  <div className="flex-1">
                    <span className="text-[#4A90D9] text-xs font-bold uppercase">📰 News</span>
                    <h3 className="latest-title text-white font-medium mt-1 line-clamp-2">
                      Pokemon TCG Pocket เปิดตัวแล้ววันนี้! ดาวน์โหลดฟรี
                    </h3>
                  </div>
                  <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=140&fit=crop" className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
              </div>
              {/* Item 3 */}
              <div className="latest-item">
                <div className="flex gap-3 cursor-pointer">
                  <div className="flex-1">
                    <span className="text-[#4DCC8A] text-xs font-bold uppercase">🎮 Review</span>
                    <h3 className="latest-title text-white font-medium mt-1 line-clamp-2">
                      รีวิว Marvel Rivals: เกม Hero Shooter ที่ทุ่มทุนสร้างได้สมบูรณ์แบบ
                    </h3>
                  </div>
                  <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&h=140&fit=crop" className="w-full h-full object-cover" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

        </section>

        {/* ========== GLOW BAR ========== */}
        <div className="glow-bar mb-10"></div>

        {/* ========== TRENDING SECTION ========== */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl">🔥</span>
            <h2 className="section-title">กำลังมาแรง</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Elden Ring" />
              </div>
              <div className="p-4">
                <span className="text-[#FF1A1A] text-xs font-bold uppercase">Review</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">Elden Ring: Nightreign รีวิวฉบับเต็ม</h3>
              </div>
            </article>
            {/* Card 2 */}
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Skyrim Mods" />
              </div>
              <div className="p-4">
                <span className="text-[#FF6B35] text-xs font-bold uppercase">📺 Live</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">วิธีติดตั้ง mods บน Skyrim ง่ายๆ</h3>
              </div>
            </article>
            {/* Card 3 */}
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Genshin" />
              </div>
              <div className="p-4">
                <span className="text-[#4A90D9] text-xs font-bold uppercase">📰 News</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">Genshin Impact ฉลอง 4 ปี พร้อมของขวัญมหาศาล</h3>
              </div>
            </article>
            {/* Card 4 */}
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Gaming Mouse" />
              </div>
              <div className="p-4">
                <span className="text-[#A855F7] text-xs font-bold uppercase">💻 Tech</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">แนะนำเมาส์เกมเบอร์ 1 ปี 2024-2025</h3>
              </div>
            </article>
          </div>
        </section>

        {/* ========== PC & CONSOLE SECTION ========== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎮</span>
              <h2 className="section-title">PC และ Console</h2>
            </div>
            <a href="#" className="text-[#FF1A1A] text-sm font-medium hover:underline">ดูทั้งหมด →</a>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-6 border-b border-[#2A2A2A] mb-6 overflow-x-auto pb-1">
            <span className="cat-tab active">ทั้งหมด</span>
            <span className="cat-tab">PC Games</span>
            <span className="cat-tab">PlayStation</span>
            <span className="cat-tab">Xbox</span>
            <span className="cat-tab">Nintendo</span>
          </div>

          {/* Article Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Elden Ring" />
              </div>
              <div className="p-4">
                <span className="text-[#FF1A1A] text-xs font-bold uppercase">Review</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">Elden Ring: Nightreign รีวิวฉบับเต็ม</h3>
              </div>
            </article>
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Skyrim" />
              </div>
              <div className="p-4">
                <span className="text-[#FF1A1A] text-xs font-bold uppercase">Tips</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">วิธีติดตั้ง mods บน Skyrim ง่ายๆ</h3>
              </div>
            </article>
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Nintendo" />
              </div>
              <div className="p-4">
                <span className="text-[#4A90D9] text-xs font-bold uppercase">News</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">Nintendo Switch 2 เปิดตัวอย่างเป็นทางการ</h3>
              </div>
            </article>
          </div>
        </section>

        {/* ========== MOBILE GAMES SECTION ========== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <h2 className="section-title">เกมมือถือ</h2>
            </div>
            <a href="#" className="text-[#FF1A1A] text-sm font-medium hover:underline">ดูทั้งหมด →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Rogue Land" />
              </div>
              <div className="p-4">
                <span className="text-[#FF1A1A] text-xs font-bold uppercase">🔥 Tips</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">Rogue Land เปลี่ยนแปลงประจำสัปดาห์ มีนอตใหม่!</h3>
              </div>
            </article>
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Honor of Kings" />
              </div>
              <div className="p-4">
                <span className="text-[#FF6B35] text-xs font-bold uppercase">📺 Live</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">มิตซึ่มรวมตัว! สรุปการแข่งขัน Honor of Kings</h3>
              </div>
            </article>
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Genshin" />
              </div>
              <div className="p-4">
                <span className="text-[#4A90D9] text-xs font-bold uppercase">📰 News</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">Genshin Impact ฉลอง 4 ปี พร้อมของขวัญมหาศาล</h3>
              </div>
            </article>
          </div>
        </section>

        {/* ========== IT & GADGET SECTION ========== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">💻</span>
              <h2 className="section-title">IT และ Gadget</h2>
            </div>
            <a href="#" className="text-[#FF1A1A] text-sm font-medium hover:underline">ดูทั้งหมด →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="ROG Ally" />
              </div>
              <div className="p-4">
                <span className="text-[#A855F7] text-xs font-bold uppercase">Gadget</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">รีวิว ROG Ally X: เครื่องเล่นเกม PC แบบพกพา</h3>
              </div>
            </article>
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Steam Deck" />
              </div>
              <div className="p-4">
                <span className="text-[#A855F7] text-xs font-bold uppercase">Tech</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">เปรียบเทียบ Steam Deck vs ROG Ally 2024</h3>
              </div>
            </article>
            <article className="card-hover cursor-pointer minimal-card bg-[#1F1F1F]">
              <div className="aspect-[16/10] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=600&h=375&fit=crop" className="w-full h-full object-cover card-img" alt="Gaming Mouse" />
              </div>
              <div className="p-4">
                <span className="text-[#A855F7] text-xs font-bold uppercase">Setup</span>
                <h3 className="text-white font-semibold mt-1 line-clamp-2">แนะนำเมาส์เกมเบอร์ 1 ปี 2024-2025</h3>
              </div>
            </article>
          </div>
        </section>

        {/* ========== FEATURED TOOLS ========== */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xl">⚡</span>
            <h2 className="section-title">เครื่องมือแนะนำ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Boss Timer */}
            <div className="card-hover cursor-pointer minimal-card bg-[#1F1F1F] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF1A1A]/20 flex items-center justify-center text-xl">⏰</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">Boss Timer</h3>
                  <p className="text-[#CFCFCF] text-sm mt-1">ตั้งเวลาแจ้งเตือนบอสในเกมต่างๆ</p>
                  <div className="flex gap-2 mt-3">
                    <span className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">Genshin</span>
                    <span className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">HSR</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Tier List */}
            <div className="card-hover cursor-pointer minimal-card bg-[#1F1F1F] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4A90D9]/20 flex items-center justify-center text-xl">📊</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">Tier List Builder</h3>
                  <p className="text-[#CFCFCF] text-sm mt-1">สร้าง Tier List แบบโต้ตอบสำหรับเกมต่างๆ</p>
                  <div className="flex gap-2 mt-3">
                    <span className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">Genshin</span>
                    <span className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">WGR</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Code Redeemer */}
            <div className="card-hover cursor-pointer minimal-card bg-[#1F1F1F] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4DCC8A]/20 flex items-center justify-center text-xl">🎁</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">Code Redeemer</h3>
                  <p className="text-[#CFCFCF] text-sm mt-1">รวมโค้ดลงทะเบียนเกมมือถือในที่เดียว</p>
                  <div className="flex gap-2 mt-3">
                    <span className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">Zenless</span>
                    <span className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">Genshin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & About */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-['Bebas_Neue'] text-2xl text-white italic">Top</span>
                <span className="font-['Bebas_Neue'] text-2xl text-[#FF1A1A] italic">Game</span>
              </div>
              <p className="text-[#CFCFCF] text-sm leading-relaxed">
                แหล่งรวมข่าวสาร เทคนิค และรีวิวเกมมือถือสำหรับเกมเมอร์ไทย
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="h-px w-4 bg-[#FF1A1A]"></div>
                <span className="font-['Inter'] text-[10px] text-[#FF1A1A] tracking-[0.2em] uppercase font-medium">Thailand</span>
                <div className="h-px w-4 bg-[#FF1A1A]"></div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">เมนู</h4>
              <ul className="space-y-2 text-[#CFCFCF] text-sm">
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">หน้าแรก</a></li>
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">ข่าวเกม</a></li>
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">วิธีเล่น</a></li>
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">รีวิว</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-white mb-4">ติดตาม</h4>
              <ul className="space-y-2 text-[#CFCFCF] text-sm">
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-[#FF1A1A] transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#2A2A2A] mt-8 pt-8 text-center text-[#888] text-sm">
            <p>© 2026 TopGame Thailand. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}