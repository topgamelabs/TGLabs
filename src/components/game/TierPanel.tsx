"use client";

import React from "react";
import type { Game } from "@/data/games";

interface TierPanelProps {
  game: Game;
}

export function TierPanel({ game }: TierPanelProps): React.JSX.Element {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: "rgba(100,80,200,0.15)",
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: 3,
            color: "#3d3560",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Tier List · Patch {game.patch}
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "rgba(100,80,200,0.15)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {game.tiers.map((tier) => (
          <div
            key={tier.label}
            style={{
              display: "flex",
              gap: 10,
              minHeight: 84,
            }}
          >
            <div
              style={{
                width: 58,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, serif",
                fontSize: 22,
                fontWeight: 900,
                borderRadius: 8,
                ...tier.style,
              }}
            >
              {tier.label}
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                background: "#0c1020",
                border: "1px solid rgba(100,80,200,0.12)",
                borderRadius: 10,
                padding: 10,
              }}
            >
              {tier.chars.map((c) => (
                <div
                  key={c.name}
                  /*
                   * P2-1: Hover scale + glow for tier char cards
                   */
                  onMouseOver={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "scale(1.08)";
                    el.style.boxShadow = `0 4px 20px ${game.colorDim}`;
                    el.style.borderColor = `${game.color}55`;
                    el.style.background = "#141930";
                  }}
                  onMouseOut={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "";
                    el.style.boxShadow = "";
                    el.style.borderColor = "rgba(100,80,200,0.15)";
                    el.style.background = "#101628";
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 10,
                      background: "#101628",
                      border: "1px solid rgba(100,80,200,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      position: "relative",
                    }}
                  >
                    {c.icon}
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 3,
                        fontSize: 8,
                        color: "#ffe08a",
                        letterSpacing: 0,
                      }}
                    >
                      {"★".repeat(c.s)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 9,
                      color: "#8878aa",
                      textAlign: "center",
                      maxWidth: 54,
                      lineHeight: 1.2,
                    }}
                  >
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          background: "#0c1020",
          border: "1px solid rgba(100,80,200,0.12)",
          borderRadius: 10,
          fontSize: 12,
          color: "#8878aa",
          lineHeight: 1.7,
        }}
      >
        ⚠️ Tier List อ้างอิงจาก <span style={{ color: "#c9a84c" }}>Patch {game.patch}</span> · อาจเปลี่ยนแปลงหลัง patch ถัดไป
      </div>
    </div>
  );
}
