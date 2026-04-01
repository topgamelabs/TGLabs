"use client";

import React from "react";
import type { Game } from "@/data/games";

const LV_COLOR = {
  beg: { bg: "rgba(77,204,138,0.15)", c: "#4dcc8a" },
  mid: { bg: "rgba(90,180,255,0.15)", c: "#5ab4ff" },
  adv: { bg: "rgba(255,92,122,0.15)", c: "#ff5c7a" },
} as const;

interface TipsPanelProps {
  game: Game;
}

export function TipsPanel({ game }: TipsPanelProps): React.JSX.Element {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
        <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#3d3560", textTransform: "uppercase", whiteSpace: "nowrap" }}>Tips & Guides</span>
        <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
        {game.tips.map((t) => (
          <div key={t.title} style={{ background: "#0c1020", border: "1px solid rgba(100,80,200,0.12)", borderRadius: 14, padding: 20 }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{t.icon}</span>
            <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, padding: "2px 8px", borderRadius: 3, display: "inline-block", marginBottom: 10, background: LV_COLOR[t.lvk].bg, color: LV_COLOR[t.lvk].c }}>{t.lv}</span>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: "#e8e0ff", marginBottom: 8 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: "#8878aa", lineHeight: 1.65 }}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
