"use client";

import React, { useState } from "react";
import type { Game } from "@/data/games";
import { GameCard } from "./GameCard";

interface HeroProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

export function Hero({ games, onSelect }: HeroProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = games.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          minHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "90px 24px 50px",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: 5,
            color: "#9d6fff",
            marginBottom: 14,
          }}
        >
          // MOBILE GAMING HUB · TH //
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: "clamp(40px,6vw,72px)", color: "#e8e0ff" }}>
            TG
          </div>
          <div
            style={{
              fontSize: "clamp(40px,6vw,72px)",
              background:
                "linear-gradient(135deg,#c4a0ff,#5ab4ff,#4dcc8a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Labs
          </div>
        </div>
        <p
          style={{
            fontSize: 15,
            color: "#8878aa",
            maxWidth: 420,
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          ศูนย์รวมข้อมูลเกมมือถือครบในที่เดียว — Tier List, Patch Notes, Tips &
          Guides, Character DB
        </p>
        {/*
         * P1-2: Enhanced search bar — glow ring + brighten on focus
         */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: searchFocused ? "#111828" : "#0c1020",
            border: `1px solid ${searchFocused ? "rgba(157,111,255,0.55)" : "rgba(100,80,200,0.25)"}`,
            borderRadius: 8,
            padding: "10px 16px",
            width: "100%",
            maxWidth: 380,
            boxShadow: searchFocused
              ? "0 0 0 2px rgba(157,111,255,0.28), 0 0 24px rgba(157,111,255,0.15)"
              : "none",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: 14, color: searchFocused ? "#c4a0ff" : "#9d6fff", transition: "color 0.2s" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="ค้นหาเกม..."
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#e8e0ff",
              fontFamily: "'Sarabun',sans-serif",
              fontSize: 14,
              flex: 1,
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 22px 80px" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: 4,
            color: "#3d3560",
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          // เลือกเกม — {filtered.length} เกม //
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} onClick={() => onSelect(g)} />
          ))}
        </div>
      </div>
    </div>
  );
}
