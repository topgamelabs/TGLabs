"use client";

import { GAMES } from "@/data/games";
import type { Game } from "@/data/games";

interface NavbarProps {
  currentGame: Game | null;
  onSelect: (game: Game | null) => void;
}

export function Navbar({ currentGame, onSelect }: NavbarProps) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        background: "rgba(2,3,5,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(100,80,200,0.15)",
      }}
    >
      <div
        onClick={() => onSelect(null)}
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 19,
          fontWeight: 900,
          letterSpacing: 3,
          cursor: "pointer",
        }}
      >
        <span style={{ color: "#e8e0ff" }}>T</span>
        <span
          style={{
            background: "linear-gradient(90deg,#c4a0ff,#5ab4ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          GLabs
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {GAMES.map((g) => {
          const isActive = currentGame?.id === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              /*
               * P2-2: Active state → background pill + border in game color
               */
              style={{
                background: isActive ? `${g.colorDim}` : "transparent",
                border: isActive
                  ? `1px solid ${g.color}55`
                  : "1px solid transparent",
                fontFamily: "monospace",
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: isActive ? g.color : "#c4a0ff",
                cursor: "pointer",
                padding: "6px 14px",
                borderRadius: 20,
                transition: "all 0.2s ease",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {g.short}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
