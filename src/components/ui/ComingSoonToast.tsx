"use client";

import { useState, useEffect } from "react";

export function ComingSoonToast() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const handler = () => {
      setVisible(true);
      setFadeOut(false);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 400);
      }, 2100);
    };
    window.addEventListener("show-coming-soon", handler);
    return () => window.removeEventListener("show-coming-soon", handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 99999,
        background: "rgba(10,10,10,0.98)",
        border: "1px solid #FF1A1A",
        borderRadius: 12,
        padding: "24px 48px",
        boxShadow: "0 0 60px rgba(255,26,26,0.5)",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
        <div style={{
          fontFamily: "'Kanit', sans-serif",
          fontSize: 22,
          color: "#fff",
          fontWeight: 600,
          letterSpacing: 1,
        }}>
          Coming Soon..
        </div>
        <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
          ฟีเจอร์นี้กำลังพัฒนา
        </div>
      </div>
    </div>
  );
}

export function showComingSoon() {
  window.dispatchEvent(new Event("show-coming-soon"));
}