"use client";

import React, { useState } from "react";
import { TierPanel } from "./TierPanel";
import { PatchPanel } from "./PatchPanel";
import { TipsPanel } from "./TipsPanel";
import { FellowsPanel } from "./FellowsPanel";
import { KupolePanel } from "./KupolePanel";

interface GamePageProps {
  game: import("@/data/games").Game;
  onBack: () => void;
}

type Tab = "tier" | "patch" | "tips" | "fellow" | "kupole";

export function GamePage({ game, onBack }: GamePageProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>("tier");

  const tabs: { key: Tab; label: string }[] = [
    { key: "tier", label: "Tier List" },
    { key: "patch", label: "Patch Notes" },
    { key: "tips", label: "Tips" },
    { key: "fellow", label: "Fellow" },
    { key: "kupole", label: "Kupole" },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, position: "relative", marginTop: 54, overflow: "hidden" }}>
        {/* Banner image or gradient background */}
        {game.banner.startsWith("/") || game.banner.startsWith("http") ? (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${game.banner})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(2,3,5,0.2) 0%, rgba(2,3,5,0.85) 100%)` }} />
          </>
        ) : (
          <>
            <div style={{ position: "absolute", inset: 0, background: game.banner }} />
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${game.colorDim} 0%, transparent 70%)` }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(2,3,5,0.3) 0%, rgba(2,3,5,0.9) 100%)" }} />
          </>
        )}
        {/* Game icon */}
        <span style={{ position: "relative", zIndex: 1 }}>{game.icon}</span>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0", borderBottom: "1px solid rgba(100,80,200,0.12)" }}>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 900, color: "#e8e0ff", marginBottom: 8 }}>{game.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#3d3560", letterSpacing: 1 }}>{game.genre}</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: game.colorDim, color: game.color, letterSpacing: 1 }}>{game.patch}</span>
            </div>
          </div>
          <button onClick={onBack} style={{ background: "rgba(100,80,200,0.15)", border: "1px solid rgba(100,80,200,0.25)", borderRadius: 8, padding: "8px 16px", color: "#e8e0ff", fontFamily: "monospace", fontSize: 11, cursor: "pointer", letterSpacing: 1 }}>
            ← Back
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "20px 0", borderBottom: "1px solid rgba(100,80,200,0.12)", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ background: tab === t.key ? game.colorDim : "transparent", border: `1px solid ${tab === t.key ? game.color + "44" : "rgba(100,80,200,0.15)"}`, borderRadius: 8, padding: "8px 16px", color: tab === t.key ? game.color : "#8878aa", fontFamily: "monospace", fontSize: 11, cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap", transition: "all 0.2s" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px 0 80px" }}>
          {tab === "tier" && <TierPanel />}
          {tab === "patch" && <PatchPanel game={game} />}
          {tab === "tips" && <TipsPanel game={game} />}
          {tab === "fellow" && <FellowsPanel />}
          {tab === "kupole" && <KupolePanel />}
        </div>
      </div>
    </div>
  );
}
