"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GAMES } from "@/data/games";
import type { Game } from "@/data/games";

// Temporary: show only Tree of Savior M
const VISIBLE_GAMES = GAMES.filter((g) => g.id === "tosm");
import { Navbar } from "@/components/nav/Navbar";
import { Hero } from "@/components/home/Hero";
import { GamePage } from "@/components/game/GamePage";

export default function Home() {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  return (
    <div
      style={{
        fontFamily: "'Sarabun','Segoe UI',sans-serif",
        background: "#020305",
        color: "#e8e0ff",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* bg glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(80,40,180,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* NAV */}
      <Navbar currentGame={currentGame} onSelect={setCurrentGame} />

      {/* CONTENT */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/*
         * P2-3: framer-motion page transitions
         */}
        <AnimatePresence mode="wait">
          {currentGame ? (
            <motion.div
              key={currentGame.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <GamePage
                game={currentGame}
                onBack={() => setCurrentGame(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Hero games={VISIBLE_GAMES} onSelect={setCurrentGame} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(100,80,200,0.12)",
          padding: "26px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 3,
            marginBottom: 6,
          }}
        >
          <span style={{ color: "#e8e0ff" }}>TG</span>
          <span
            style={{
              background: "linear-gradient(90deg,#c4a0ff,#5ab4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Labs
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#3d3560" }}>
          ศูนย์รวมข้อมูล Mobile Gaming · ข้อมูลอิงจาก patch ล่าสุดของแต่ละเกม
        </div>
      </div>
    </div>
  );
}
