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

    </nav>
  );
}
