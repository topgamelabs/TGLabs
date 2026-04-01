"use client";

import React from "react";
import type { Game } from "@/data/games";

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps): React.JSX.Element {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#0c1020",
        border: `${game.color}22`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = game.colorDim;
        e.currentTarget.style.borderColor = `${game.color}55`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = `${game.color}22`;
      }}
    >
      <div
        style={{
          height: 110,
          background: game.banner,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          position: "relative",
        }}
      >
        {game.icon}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${game.colorDim} 0%, transparent 70%)`,
          }}
        />
        {game.tags.map((tag) => (
          <span
            key={tag}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: 1.5,
              padding: "2px 8px",
              borderRadius: 3,
              background:
                tag === "HOT"
                  ? "rgba(255,92,122,0.25)"
                  : "rgba(90,180,255,0.25)",
              border: `1px solid ${
                tag === "HOT" ? "#ff5c7a88" : "#5ab4ff88"
              }`,
              color: tag === "HOT" ? "#ff5c7a" : "#5ab4ff",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#e8e0ff",
            marginBottom: 4,
          }}
        >
          {game.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "#3d3560",
              letterSpacing: 1,
            }}
          >
            {game.genre}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              padding: "1px 7px",
              borderRadius: 3,
              background: game.colorDim,
              color: game.color,
              letterSpacing: 1,
            }}
          >
            {game.patch}
          </span>
        </div>
      </div>
    </div>
  );
}
