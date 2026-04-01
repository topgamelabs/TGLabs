"use client";

import React from "react";
import { PTag } from "@/components/ui/PTag";
import type { Game } from "@/data/games";

interface PatchPanelProps {
  game: Game;
}

export function PatchPanel({ game }: PatchPanelProps): React.JSX.Element {

return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
        <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#3d3560", textTransform: "uppercase", whiteSpace: "nowrap" }}>Patch Notes ล่าสุด</span>
        <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {game.patches.map((p) => (
          <div key={p.ver} style={{ background: "#0c1020", border: "1px solid rgba(100,80,200,0.12)", borderLeft: `3px solid ${game.color}`, borderRadius: "0 12px 12px 0", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, padding: "2px 10px", borderRadius: 4, background: game.colorDim, border: `1px solid ${game.color}44`, color: game.color }}>{p.ver}</span>
              <span style={{ fontSize: 11, color: "#3d3560" }}>{p.date}</span>
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#c9a84c", marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 13, color: "#8878aa", lineHeight: 1.65 }}>{p.desc}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {p.tags.map(([l, t]) => (
                <PTag key={l} label={l} type={t as "buff" | "nerf" | "new" | "event" | "fix"} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
