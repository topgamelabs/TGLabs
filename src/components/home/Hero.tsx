"use client";

import React, { useState } from "react";
import type { Game } from "@/data/games";

interface HeroProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

export function Hero({ games, onSelect }: HeroProps): React.JSX.Element {
  const [search, setSearch] = useState("");

  const filtered = games.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.genre.toLowerCase().includes(search.toLowerCase())
  );

return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ minHeight: "72vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "90px 24px 50px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 5, color: "#9d6fff", marginBottom: 14 }}>
          // MOBILE GAMING HUB · TH //
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, lineHeight: 1.05, marginBottom: 18 }}>
          <div style={{ fontSize: "clamp(40px,6vw,72px)", color: "#e8e0ff" }}>TG</div>
          <div style={{ fontSize: "clamp(40px,6vw,72px)", background: "linear-gradient(135deg,#c4a0ff,#5ab4ff,#4dcc8a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Labs
          </div>
        </div>
        <p style={{ fontSize: 15, color: "#8878aa", maxWidth: 420, lineHeight: 1.7, marginBottom: 36 }}>
          ศูนย์รวมข้อมูลเกมมือถือครบในที่เดียว — Tier List, Patch Notes, Tips & Guides, Character DB
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0c1020", border: "1px solid rgba(100,80,200,0.2)", borderRadius: 8, padding: "10px 16px", width: "100%", maxWidth: 380 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาเกม..."
            style={{ background: "none", border: "none", outline: "none", color: "#e8e0ff", fontFamily: "'Sarabun',sans-serif", fontSize: 14, flex: 1 }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 22px 80px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 4, color: "#3d3560", marginBottom: 20, textTransform: "uppercase" }}>
          // เลือกเกม — {filtered.length} เกม //
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {filtered.map((g) => (
            <div
              key={g.id}
              onClick={() => onSelect(g)}
              style={{ background: "#0c1020", border: `${g.color}22`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.25s" }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = `${g.colorDim}`; e.currentTarget.style.borderColor = `${g.color}55`; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = `${g.color}22`; }}
            >
              <div style={{ height: 110, background: g.banner, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, position: "relative" }}>
                {g.icon}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${g.colorDim} 0%, transparent 70%)` }} />
                {g.tags.map((tag) => (
                  <span key={tag} style={{ position: "absolute", top: 10, right: 10, fontFamily: "monospace", fontSize: 9, letterSpacing: 1.5, padding: "2px 8px", borderRadius: 3, background: tag === "HOT" ? "rgba(255,92,122,0.25)" : "rgba(90,180,255,0.25)", border: `1px solid ${tag === "HOT" ? "#ff5c7a88" : "#5ab4ff88"}`, color: tag === "HOT" ? "#ff5c7a" : "#5ab4ff" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#e8e0ff", marginBottom: 4 }}>
                  {g.name}

                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#3d3560", letterSpacing: 1 }}>

{g.genre}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, padding: "1px 7px", borderRadius: 3, background: g.colorDim, color: g.color, letterSpacing: 1 }}>
                    {g.patch}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
