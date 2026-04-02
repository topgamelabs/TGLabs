"use client";

import React, { useState, useMemo } from "react";
import fellowsData from "@/data/fellows-db.json";
import kupoleData from "@/data/kupole-db.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type Fellow = typeof fellowsData[number];
type Kupole = typeof kupoleData[number];

// ─── Shared color constants ──────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  "S+": "#ff4757",
  S: "#ff6b6b",
  "A+": "#ffa94d",
  A: "#ffd43b",
  "B+": "#8ce99a",
  B: "#69db7c",
  C: "#74c0fc",
  D: "#868e96",
  F: "#495057",
  OP: "#ff4757",
  SS: "#9d6fff",
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#ff6b35",
  Ice: "#74c0fc",
  Lightning: "#ffd43b",
  Earth: "#a8845c",
  Dark: "#9d6fff",
  Holy: "#ffe066",
  Multi: "#c0eb75",
};

const ELEMENT_ICONS: Record<string, string> = {
  Fire: "🔥",
  Ice: "❄️",
  Lightning: "⚡",
  Earth: "🌍",
  Dark: "🌑",
  Holy: "✨",
  Multi: "🔮",
};

const FELLOW_GRADE_COLORS: Record<string, string> = {
  "Demigod UR": "#9d6fff",
  "Collaboration UR": "#ff6b9d",
  "Limited UR": "#ffd43b",
  SR: "#4dcc8a",
  R: "#868e96",
};

const TYPE_COLORS: Record<string, string> = {
  Goddess: "#ffe066",
  Demon: "#9d6fff",
};

const GRADE_COLORS_KUPOLE: Record<string, string> = {
  "Limited UR": "#9d6fff",
  UR: "#4dcc8a",
};

// ─── Tier order maps ─────────────────────────────────────────────────────────

const FELLOW_TIER_ORDER: Record<string, number> = {
  "SS+": 0, "SS": 1, "S+": 2, S: 3, "A+": 4, A: 5, "B+": 6, B: 7, C: 8, D: 9, F: 10,
};

const KUPOLE_TIER_ORDER: Record<string, number> = {
  OP: 0, SS: 1, "SS+": 2, S: 3, "S+": 4, "A+": 5, A: 6, "B+": 7, B: 8, C: 9, F: 10,
};

const FELLOW_TIER_LIST = ["SS+","SS","S+","S","A+","A","B+","B","C","D","F"];
const KUPOLE_TIER_LIST = ["OP","SS","SS+","S","S+","A+","A","B+","B","C","F"];

// ─── Badge helpers ────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? "#868e96";
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "monospace",
      fontWeight: 700,
      color: "#fff",
      background: color,
      letterSpacing: 0.5,
    }}>
      {tier}
    </span>
  );
}

function ElementBadge({ element }: { element: string }) {
  const color = ELEMENT_COLORS[element] ?? "#868e96";
  const icon = ELEMENT_ICONS[element] ?? "❓";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10,
      fontFamily: "monospace",
      letterSpacing: 0.5,
      color,
      border: `1px solid ${color}44`,
      background: `${color}11`,
    }}>
      {icon} {element}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const color = FELLOW_GRADE_COLORS[grade] ?? "#868e96";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "monospace",
      fontWeight: 700,
      letterSpacing: 0.5,
      color: "#fff",
      background: color,
    }}>
      {grade}
    </span>
  );
}

function KupoleGradeBadge({ grade }: { grade: string }) {
  const color = GRADE_COLORS_KUPOLE[grade] ?? "#868e96";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "monospace",
      fontWeight: 700,
      letterSpacing: 0.5,
      color: "#fff",
      background: color,
    }}>
      {grade}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? "#9d6fff";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10,
      fontFamily: "monospace",
      letterSpacing: 0.5,
      color,
      border: `1px solid ${color}44`,
      background: `${color}11`,
    }}>
      {type === "Goddess" ? "✨" : "😈"} {type}
    </span>
  );
}

// ─── Skill Row (reused in modals) ─────────────────────────────────────────────

function SkillRow({ label, desc }: { label: string; desc: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(desc).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  if (!desc || desc.trim() === "" || desc === "ไม่มี") return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#9d6fff", textTransform: "uppercase" }}>
          {label}
        </span>
        <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: copied ? "#4dcc8a" : "#3d3560", fontFamily: "monospace", transition: "color 0.2s" }}>
          {copied ? "✓ copied" : "📋 copy"}
        </button>
      </div>
      <p style={{ fontFamily: "Sarabun, sans-serif", fontSize: 12, lineHeight: 1.6, color: "#c4b5e0", margin: 0, padding: "8px 10px", background: "#0a0d1a", borderRadius: 6, border: "1px solid rgba(100,80,200,0.1)", whiteSpace: "pre-wrap" }}>
        {desc}
      </p>
    </div>
  );
}

// ─── Fellow Modal ─────────────────────────────────────────────────────────────

function FellowModal({ fellow, onClose }: { fellow: Fellow; onClose: () => void }) {
  const tl = fellow.tierlist;
  const isDemigod = fellow.grade === "Demigod UR";
  const elemColor = ELEMENT_COLORS[fellow.element] ?? "#9d6fff";
  const gradeColor = FELLOW_GRADE_COLORS[fellow.grade] ?? "#868e96";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,3,5,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0c1020", border: "1px solid rgba(100,80,200,0.25)", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(100,80,200,0.12)", position: "sticky", top: 0, background: "#0c1020", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 900, color: "#e8e0ff", margin: "0 0 8px 0" }}>{fellow.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <ElementBadge element={fellow.element} />
                <GradeBadge grade={fellow.grade} />
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#5a5478", letterSpacing: 1 }}>{fellow.classInfo}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(100,80,200,0.12)", border: "1px solid rgba(100,80,200,0.2)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8878aa", fontSize: 16, flexShrink: 0 }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {/* Tierlist */}
          {tl && tl.overall && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "#080b18", border: "1px solid rgba(100,80,200,0.15)", marginBottom: 16 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#3d3560", textTransform: "uppercase", marginBottom: 10 }}>
                Tierlist — Overall: <span style={{ color: TIER_COLORS[tl.overall] ?? "#fff", fontWeight: 700 }}>{tl.overall}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["⚔️ DMG", tl.damage],
                  ["🛡️ SURV", tl.survival],
                  ["🗡️ OFF-SUP", tl.offensiveSupport],
                  ["🏥 DEF-SUP", tl.defensiveSupport],
                  ["🔧 UTIL", tl.utility],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "#0c1020", borderRadius: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: "#8878aa", letterSpacing: 0.5 }}>{label}</span>
                    <TierBadge tier={val ?? ""} />
                  </div>
                ))}
              </div>
              {tl.notes && (
                <p style={{ margin: "8px 0 0 0", fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#7a6a9a", lineHeight: 1.5, fontStyle: "italic" }}>
                  💬 {tl.notes}
                </p>
              )}
            </div>
          )}

          {/* Leader Skill (Demigod only) */}
          {isDemigod && fellow.leaderSkill && (
            <div style={{ marginBottom: 16 }}>
              <SkillRow label="Leader Skill" desc={fellow.leaderSkill} />
            </div>
          )}

          {/* Skills */}
          <div style={{ marginBottom: 16 }}>
            <SkillRow label="Basic Attack" desc={fellow.basicAttack ?? ""} />
            <SkillRow label="Skill 1" desc={fellow.skill1 ?? ""} />
            <SkillRow label="Skill 2" desc={fellow.skill2 ?? ""} />
            <SkillRow label="Skill 3" desc={fellow.skill3 ?? ""} />
            <SkillRow label="Awaken Skill" desc={fellow.awakenSkill ?? ""} />
          </div>

          {/* Info footer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "12px 14px", background: "#080b18", borderRadius: 8, border: "1px solid rgba(100,80,200,0.1)" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Obtain</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>{fellow.obtainFrom}</div>
            </div>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Bonus</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>{fellow.acquireBonus}</div>
            </div>
            {fellow.requiredMats && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Max Rank Materials</div>
                <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#4dcc8a" }}>{fellow.requiredMats}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kupole Modal ─────────────────────────────────────────────────────────────

function KupoleModal({ kupole, onClose }: { kupole: Kupole; onClose: () => void }) {
  const tl = kupole.tierlist;
  const typeColor = TYPE_COLORS[kupole.type] ?? "#9d6fff";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,3,5,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0c1020", border: "1px solid rgba(100,80,200,0.25)", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(100,80,200,0.12)", position: "sticky", top: 0, background: "#0c1020", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 900, color: "#e8e0ff", margin: "0 0 8px 0" }}>{kupole.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <TypeBadge type={kupole.type} />
                <KupoleGradeBadge grade={kupole.grade} />
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#5a5478", letterSpacing: 1 }}>{kupole.obtainFrom}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(100,80,200,0.12)", border: "1px solid rgba(100,80,200,0.2)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8878aa", fontSize: 16, flexShrink: 0 }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {/* Tierlist */}
          {tl && tl.overall && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "#080b18", border: "1px solid rgba(100,80,200,0.15)", marginBottom: 16 }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: "#3d3560", textTransform: "uppercase", marginBottom: 10 }}>
                Tierlist — Overall:
                <span style={{ color: TIER_COLORS[tl.overall] ?? "#fff", fontWeight: 700, marginLeft: 8 }}>
                  {tl.overall}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["⚔️ DMG BUFF", tl.damageBuff],
                  ["🛡️ SURVIVAL", tl.survival],
                  ["🔧 UTILITY", tl.utility],
                  ["👥 PARTY BUFF", tl.partyBuff],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "#0c1020", borderRadius: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 9, color: "#8878aa", letterSpacing: 0.5 }}>{label}</span>
                    <TierBadge tier={val ?? ""} />
                  </div>
                ))}
              </div>
              {tl.notes && (
                <p style={{ margin: "8px 0 0 0", fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#7a6a9a", lineHeight: 1.5, fontStyle: "italic" }}>
                  💬 {tl.notes}
                </p>
              )}
            </div>
          )}

          {/* Bonuses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "12px 14px", background: "#080b18", borderRadius: 8, border: "1px solid rgba(100,80,200,0.1)", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Rank Bonus</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>{kupole.rankBonus}</div>
            </div>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Bond Bonus</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>{kupole.bondBonus}</div>
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 16 }}>
            <SkillRow label="Passive Skill" desc={kupole.passiveSkill ?? ""} />
            <SkillRow label="Active Skill" desc={kupole.activeSkill ?? ""} />
          </div>

          {/* Rank Unlock */}
          {kupole.rankUnlock && kupole.rankUnlock.length > 0 && (
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#9d6fff", textTransform: "uppercase", marginBottom: 8 }}>
                Rank Unlock
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {kupole.rankUnlock.map((rank, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 10px", background: "#0a0d1a", borderRadius: 6, border: "1px solid rgba(100,80,200,0.1)" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#9d6fff", whiteSpace: "nowrap" }}>R{i + 1}</span>
                    <span style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#c4b5e0", lineHeight: 1.5 }}>{rank}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fellow Card ──────────────────────────────────────────────────────────────

function FellowTierCard({ fellow, onClick }: { fellow: Fellow; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const elemColor = ELEMENT_COLORS[fellow.element] ?? "#9d6fff";
  const gradeColor = FELLOW_GRADE_COLORS[fellow.grade] ?? "#868e96";
  const tierColor = TIER_COLORS[fellow.tierlist?.overall ?? ""] ?? "#868e96";

  return (
    <div
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        background: hovered ? "#111828" : "#0c1020",
        border: `1px solid ${hovered ? elemColor + "44" : "rgba(100,80,200,0.15)"}`,
        borderRadius: 14,
        padding: "20px 14px 16px",
        textAlign: "center",
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "scale(1.04)" : "scale(1)",
        boxShadow: hovered ? `0 6px 24px ${elemColor}22` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${elemColor}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s",
      }} />

      {/* Portrait */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${elemColor}22, ${gradeColor}22)`,
        border: `1px solid ${elemColor}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 10px",
        fontSize: 36,
        position: "relative",
      }}>
        <span style={{ opacity: 0.9 }}>{ELEMENT_ICONS[fellow.element] ?? "👤"}</span>
        <span style={{
          position: "absolute",
          bottom: -4,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 9,
          color: gradeColor,
          letterSpacing: -1,
          fontFamily: "monospace",
        }}>
          {"★".repeat(fellow.rarity)}
        </span>
        {/* Tier badge top-right */}
        {fellow.tierlist?.overall && (
          <span style={{
            position: "absolute",
            top: -6,
            right: -6,
            padding: "1px 5px",
            borderRadius: 4,
            fontSize: 9,
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#fff",
            background: tierColor,
            border: `1px solid #fff2`,
          }}>
            {fellow.tierlist.overall}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 12,
        fontWeight: 700,
        color: "#e8e0ff",
        marginBottom: 6,
        lineHeight: 1.2,
        minHeight: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {fellow.name}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
        <ElementBadge element={fellow.element} />
        <GradeBadge grade={fellow.grade} />
      </div>
    </div>
  );
}

// ─── Kupole Card ──────────────────────────────────────────────────────────────

function KupoleTierCard({ kupole, onClick }: { kupole: Kupole; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const typeColor = TYPE_COLORS[kupole.type] ?? "#9d6fff";
  const gradeColor = GRADE_COLORS_KUPOLE[kupole.grade] ?? "#868e96";
  const tierColor = TIER_COLORS[kupole.tierlist?.overall ?? ""] ?? "#868e96";

  return (
    <div
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        background: hovered ? "#111828" : "#0c1020",
        border: `1px solid ${hovered ? typeColor + "44" : "rgba(100,80,200,0.15)"}`,
        borderRadius: 14,
        padding: "20px 14px 16px",
        textAlign: "center",
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "scale(1.04)" : "scale(1)",
        boxShadow: hovered ? `0 6px 24px ${typeColor}22` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${typeColor}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s",
      }} />

      {/* Portrait */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${typeColor}22, ${gradeColor}22)`,
        border: `1px solid ${typeColor}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 10px",
        fontSize: 36,
        position: "relative",
      }}>
        <span style={{ opacity: 0.9 }}>{kupole.type === "Goddess" ? "✨" : "😈"}</span>
        {/* Tier badge top-right */}
        {kupole.tierlist?.overall && (
          <span style={{
            position: "absolute",
            top: -6,
            right: -6,
            padding: "1px 5px",
            borderRadius: 4,
            fontSize: 9,
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#fff",
            background: tierColor,
            border: `1px solid #fff2`,
          }}>
            {kupole.tierlist.overall}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 12,
        fontWeight: 700,
        color: "#e8e0ff",
        marginBottom: 6,
        lineHeight: 1.2,
        minHeight: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {kupole.name}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
        <TypeBadge type={kupole.type} />
        <KupoleGradeBadge grade={kupole.grade} />
      </div>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
      <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: "#3d3560", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
    </div>
  );
}

function TierRow({ tier, chars, renderCard }: { tier: string; chars: React.ReactNode[]; renderCard: (index: number) => React.ReactNode }) {
  if (chars.length === 0) return null;
  const color = TIER_COLORS[tier] ?? "#868e96";
  return (
    <div style={{ marginBottom: 20 }}>
      {/* Tier label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontSize: 16,
          fontWeight: 900,
          color: "#fff",
          flexShrink: 0,
          boxShadow: `0 2px 12px ${color}44`,
        }}>
          {tier}
        </div>
        <div style={{ flex: 1, height: 1, background: `${color}22` }} />
        <span style={{ fontFamily: "monospace", fontSize: 9, color: color, letterSpacing: 1 }}>
          {chars.length} {chars.length === 1 ? "unit" : "units"}
        </span>
      </div>
      {/* Cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 10,
      }}>
        {chars}
      </div>
    </div>
  );
}

// ─── Main TierPanel ───────────────────────────────────────────────────────────

export function TierPanel(): React.JSX.Element {
  const [section, setSection] = useState<"fellows" | "kupoles">("fellows");
  const [selectedFellow, setSelectedFellow] = useState<Fellow | null>(null);
  const [selectedKupole, setSelectedKupole] = useState<Kupole | null>(null);

  // Group fellows by tier
  const fellowsByTier = useMemo(() => {
    const map: Record<string, Fellow[]> = {};
    for (const f of fellowsData as Fellow[]) {
      const tier = f.tierlist?.overall ?? "C";
      if (!map[tier]) map[tier] = [];
      map[tier].push(f);
    }
    // Sort within each tier by rarity desc then name asc
    for (const t of Object.keys(map)) {
      map[t].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
    }
    return map;
  }, []);

  // Group kupoles by tier
  const kupolesByTier = useMemo(() => {
    const map: Record<string, Kupole[]> = {};
    for (const k of kupoleData as Kupole[]) {
      const tier = k.tierlist?.overall ?? "C";
      if (!map[tier]) map[tier] = [];
      map[tier].push(k);
    }
    for (const t of Object.keys(map)) {
      map[t].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, []);

  const fellowTierOrder = FELLOW_TIER_LIST;
  const kupoleTierOrder = KUPOLE_TIER_LIST;

  const fellowCount = fellowsData.length;
  const kupoleCount = kupoleData.length;

  return (
    <>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button
          onClick={() => setSection("fellows")}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: `1px solid ${section === "fellows" ? "#9d6fff44" : "rgba(100,80,200,0.15)"}`,
            background: section === "fellows" ? "rgba(157,111,255,0.15)" : "transparent",
            color: section === "fellows" ? "#c4a0ff" : "#5a5478",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
            transition: "all 0.2s",
          }}
        >
          🗡️ Fellow Tier List
        </button>
        <button
          onClick={() => setSection("kupoles")}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: `1px solid ${section === "kupoles" ? "#4dcc8a44" : "rgba(100,80,200,0.15)"}`,
            background: section === "kupoles" ? "rgba(77,204,138,0.12)" : "transparent",
            color: section === "kupoles" ? "#4dcc8a" : "#5a5478",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
            transition: "all 0.2s",
          }}
        >
          ✨ Kupole Tier List
        </button>
      </div>

      {/* Fellow Tier List */}
      {section === "fellows" && (
        <div>
          <SectionHeader label={`Fellow Tier List · ${fellowCount} Fellows`} />
          {fellowTierOrder.map((tier) => {
            const chars = fellowsByTier[tier] ?? [];
            return (
              <TierRow
                key={tier}
                tier={tier}
                chars={chars.map((f) => (
                  <FellowTierCard
                    key={f.name}
                    fellow={f}
                    onClick={() => setSelectedFellow(f)}
                  />
                ))}
              />
            );
          })}
          {/* Fallback for any tiers not in the ordered list */}
          {Object.keys(fellowsByTier)
            .filter((t) => !fellowTierOrder.includes(t))
            .map((tier) => (
              <TierRow
                key={tier}
                tier={tier}
                chars={(fellowsByTier[tier] ?? []).map((f) => (
                  <FellowTierCard
                    key={f.name}
                    fellow={f}
                    onClick={() => setSelectedFellow(f)}
                  />
                ))}
              />
            ))}
        </div>
      )}

      {/* Kupole Tier List */}
      {section === "kupoles" && (
        <div>
          <SectionHeader label={`Kupole Tier List · ${kupoleCount} Kupoles`} />
          {kupoleTierOrder.map((tier) => {
            const chars = kupolesByTier[tier] ?? [];
            return (
              <TierRow
                key={tier}
                tier={tier}
                chars={chars.map((k) => (
                  <KupoleTierCard
                    key={k.id}
                    kupole={k}
                    onClick={() => setSelectedKupole(k)}
                  />
                ))}
              />
            );
          })}
          {/* Fallback for any tiers not in the ordered list */}
          {Object.keys(kupolesByTier)
            .filter((t) => !kupoleTierOrder.includes(t))
            .map((tier) => (
              <TierRow
                key={tier}
                tier={tier}
                chars={(kupolesByTier[tier] ?? []).map((k) => (
                  <KupoleTierCard
                    key={k.id}
                    kupole={k}
                    onClick={() => setSelectedKupole(k)}
                  />
                ))}
              />
            ))}
        </div>
      )}

      {/* Modals */}
      {selectedFellow && (
        <FellowModal fellow={selectedFellow} onClose={() => setSelectedFellow(null)} />
      )}
      {selectedKupole && (
        <KupoleModal kupole={selectedKupole} onClose={() => setSelectedKupole(null)} />
      )}
    </>
  );
}
