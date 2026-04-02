"use client";

import React, { useState, useEffect } from "react";
import type { Game } from "@/data/games";
import { GameCard } from "./GameCard";

interface HeroProps {
  games: Game[];
  onSelect: (game: Game) => void;
}

export function Hero({ games, onSelect }: HeroProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth <= 640);
      setIsTablet(window.innerWidth > 640 && window.innerWidth <= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const filtered = games.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.genre.toLowerCase().includes(search.toLowerCase())
  );

  // Featured data from ToS M
  const featuredGame = games[0];
  const latestPatch = featuredGame?.patches[0];
  const newsUpdate = featuredGame?.patches[1] ?? featuredGame?.patches[0];
  const latestArticle = featuredGame?.tips[0];

  // Stats from ToS M data
  const stats = [
    { icon: "🌿", value: "25+", label: "Classes" },
    { icon: "⚔️", value: "12+", label: "Dungeons" },
    { icon: "🛡️", value: "17", label: "Fellows" },
    { icon: "📅", value: "v2.4.1", label: "Latest" },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── HERO SECTION ── */}
      <div
        style={{
          position: "relative",
          minHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "100px 24px 60px",
          overflow: "hidden",
        }}
      >
        {/* Background texture — subtle grid pattern */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(157,111,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(157,111,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        {/* ToS M Banner Image as hero background */}
        {featuredGame?.banner.startsWith("/") || featuredGame?.banner.startsWith("http") ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${featuredGame.banner})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              opacity: 0.3,
              pointerEvents: "none",
            }}
          />
        ) : null}

        {/* Bottom fade overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "240px",
            background:
              "linear-gradient(to bottom, transparent, #020305)",
            pointerEvents: "none",
          }}
        />
        {/* Top fade for banner blending */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "120px",
            background:
              "linear-gradient(to bottom, #020305, transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Label */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: 6,
            color: "#9d6fff",
            marginBottom: 18,
            position: "relative",
          }}
        >
          // MOBILE GAMING HUB · TH //
        </div>

        {/* Logo — 40% larger on desktop */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 900,
            lineHeight: 1.0,
            marginBottom: 22,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "clamp(52px, 8vw, 100px)",
              color: "#e8e0ff",
              letterSpacing: "-2px",
            }}
          >
            TG
          </div>
          <div
            style={{
              fontSize: "clamp(52px, 8vw, 100px)",
              background: "linear-gradient(135deg,#c4a0ff,#5ab4ff,#4dcc8a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-2px",
            }}
          >
            Labs
          </div>
        </div>

        {/* Tagline — bigger & more prominent */}
        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "#8878aa",
            maxWidth: 520,
            lineHeight: 1.75,
            marginBottom: 40,
            position: "relative",
          }}
        >
          ศูนย์รวมข้อมูลเกมมือถือครบในที่เดียว —{" "}
          <span style={{ color: "#c4a0ff", fontWeight: 600 }}>
            Tier List, Patch Notes, Tips & Guides, Character DB
          </span>
        </p>

        {/* Search bar — wider on desktop */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: searchFocused ? "#111828" : "#0c1020",
            border: `1px solid ${searchFocused ? "rgba(157,111,255,0.55)" : "rgba(100,80,200,0.25)"}`,
            borderRadius: 10,
            padding: "12px 18px",
            width: "100%",
            maxWidth: 500,
            boxShadow: searchFocused
              ? "0 0 0 3px rgba(157,111,255,0.2), 0 0 32px rgba(157,111,255,0.12)"
              : "none",
            transition: "all 0.2s ease",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 15,
              color: searchFocused ? "#c4a0ff" : "#9d6fff",
              transition: "color 0.2s",
            }}
          >
            🔍
          </span>
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
              fontSize: 15,
              flex: 1,
            }}
          />
        </div>

        {/* Game Banner Visual */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 700,
            marginTop: 36,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(100,80,200,0.2)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            aspectRatio: "16/9",
            background: "#0c1020",
          }}
        >
          <img
            src="/games/tosm-banner.jpg"
            alt="Tree of Savior M Banner"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* Overlay gradient at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50%",
              background: "linear-gradient(to bottom, transparent, rgba(2,3,5,0.8))",
              pointerEvents: "none",
            }}
          />
          {/* Game title badge */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#e8e0ff",
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              Tree of Savior M
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                background: "rgba(77,204,138,0.2)",
                border: "1px solid rgba(77,204,138,0.4)",
                color: "#4dcc8a",
                letterSpacing: 1,
              }}
            >
              v2.4.1
            </span>
          </div>
        </div>
      </div>

      {/* ── FEATURED CONTENT HUB ── */}
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 24px 60px",
        }}
      >
        {/* Section label */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: 5,
            color: "#3d3560",
            marginBottom: 20,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          // Featured Content //
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
              ? "repeat(2, 1fr)"
              : "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 64,
          }}
        >
          {/* 📰 News Update Card */}
          <div
            style={{
              background: "#0c1020",
              border: "1px solid rgba(100,80,200,0.2)",
              borderRadius: 16,
              padding: "22px 20px",
              cursor: "pointer",
              transition: "all 0.25s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(157,111,255,0.12)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(157,111,255,0.4)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(100,80,200,0.2)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>📰</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "#9d6fff",
                  textTransform: "uppercase",
                }}
              >
                News Update
              </span>
            </div>
            {newsUpdate && (
              <>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "#3d3560",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  {newsUpdate.ver} · {newsUpdate.date}
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#e8e0ff",
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {newsUpdate.title}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#5a5080",
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  {newsUpdate.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {newsUpdate.tags.map(([tag, type]) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: 1,
                        padding: "2px 8px",
                        borderRadius: 3,
                        background:
                          type === "new"
                            ? "rgba(77,204,138,0.15)"
                            : type === "buff"
                            ? "rgba(90,180,255,0.15)"
                            : type === "nerf"
                            ? "rgba(255,92,122,0.15)"
                            : "rgba(157,111,255,0.1)",
                        border: `1px solid ${
                          type === "new"
                            ? "#4dcc8a55"
                            : type === "buff"
                            ? "#5ab4ff55"
                            : type === "nerf"
                            ? "#ff5c7a55"
                            : "#9d6fff44"
                        }`,
                        color:
                          type === "new"
                            ? "#4dcc8a"
                            : type === "buff"
                            ? "#5ab4ff"
                            : type === "nerf"
                            ? "#ff5c7a"
                            : "#9d6fff",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 📖 Latest Article Card */}
          <div
            style={{
              background: "#0c1020",
              border: "1px solid rgba(100,80,200,0.2)",
              borderRadius: 16,
              padding: "22px 20px",
              cursor: "pointer",
              transition: "all 0.25s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(77,204,138,0.1)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(77,204,138,0.4)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(100,80,200,0.2)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>📖</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "#4dcc8a",
                  textTransform: "uppercase",
                }}
              >
                Latest Article
              </span>
            </div>
            {latestArticle && (
              <>
                <div
                  style={{
                    display: "inline-block",
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: 1,
                    padding: "2px 8px",
                    borderRadius: 3,
                    background:
                      latestArticle.lvk === "beg"
                        ? "rgba(77,204,138,0.15)"
                        : latestArticle.lvk === "mid"
                        ? "rgba(157,111,255,0.15)"
                        : "rgba(255,92,122,0.15)",
                    color:
                      latestArticle.lvk === "beg"
                        ? "#4dcc8a"
                        : latestArticle.lvk === "mid"
                        ? "#9d6fff"
                        : "#ff5c7a",
                    marginBottom: 10,
                  }}
                >
                  {latestArticle.lv}
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#e8e0ff",
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {latestArticle.title}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#5a5080",
                    lineHeight: 1.6,
                  }}
                >
                  {latestArticle.desc}
                </p>
              </>
            )}
          </div>

          {/* 🗺️ Patch Note Card */}
          <div
            style={{
              background: "#0c1020",
              border: "1px solid rgba(100,80,200,0.2)",
              borderRadius: 16,
              padding: "22px 20px",
              cursor: "pointer",
              transition: "all 0.25s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(90,180,255,0.1)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(90,180,255,0.4)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(100,80,200,0.2)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 28 }}>🗺️</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "#5ab4ff",
                  textTransform: "uppercase",
                }}
              >
                Patch Note
              </span>
            </div>
            {latestPatch && (
              <>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "#3d3560",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  {latestPatch.ver} · {latestPatch.date}
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#e8e0ff",
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {latestPatch.title}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#5a5080",
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  {latestPatch.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {latestPatch.tags.map(([tag, type]) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: 1,
                        padding: "2px 8px",
                        borderRadius: 3,
                        background:
                          type === "new"
                            ? "rgba(77,204,138,0.15)"
                            : type === "buff"
                            ? "rgba(90,180,255,0.15)"
                            : type === "nerf"
                            ? "rgba(255,92,122,0.15)"
                            : "rgba(157,111,255,0.1)",
                        border: `1px solid ${
                          type === "new"
                            ? "#4dcc8a55"
                            : type === "buff"
                            ? "#5ab4ff55"
                            : type === "nerf"
                            ? "#ff5c7a55"
                            : "#9d6fff44"
                        }`,
                        color:
                          type === "new"
                            ? "#4dcc8a"
                            : type === "buff"
                            ? "#5ab4ff"
                            : type === "nerf"
                            ? "#ff5c7a"
                            : "#9d6fff",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>



        {/* ── GAME CARD — ToS M Only ── */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: 4,
            color: "#3d3560",
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          // Tree of Savior M //
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {games.slice(0, 1).map((g) => (
            <GameCard key={g.id} game={g} onClick={() => onSelect(g)} />
          ))}
        </div>
      </div>
    </div>
  );
}
