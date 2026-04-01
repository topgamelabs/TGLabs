"use client";

import React from "react";
import type { Game } from "@/data/games";

interface CharsPanelProps {
  game: Game;
}

export function CharsPanel({ game }: CharsPanelProps): React.JSX.Element {

return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
        <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#3d3560", textTransform: "uppercase", whiteSpace: "nowrap" }}>Character Database</span>
        <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
        {game.chars.map((c) => (
          <div key={c.name} style={{ background: "#0c1020", border: `1px solid ${game.color}22`, borderRadius: 14, padding: 20, textAlign: "center", transition: "all 0.2s" }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: "#101628", border: "1px solid rgba(100,80,200,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px", position: "relative" }}>
              {c.icon}
              <span style={{ position: "absolute", top: 2, right: 4, fontSize: 9, color: "#ffe08a", letterSpacing: 0 }}>{"★".repeat(c.s)}</span>
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#e8e0ff", marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: game.color, letterSpacing: 1 }}>{c.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
