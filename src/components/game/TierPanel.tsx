"use client";

import React, { useState, useMemo } from "react";
import fellowsData from "@/data/fellows-db.json";
import kupoleData from "@/data/kupole-db.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type Fellow = typeof fellowsData[number];
type Kupole = typeof kupoleData[number];

// ─── Shared color constants ──────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  S: "#ff4757",
  A: "#ffd43b",
  B: "#4dcc8a",
  C: "#74c0fc",
  Junk: "#868e96",
};

const TIER_BG: Record<string, string> = {
  S: "rgba(255,71,87,0.15)",
  A: "rgba(255,212,59,0.15)",
  B: "rgba(77,204,138,0.15)",
  C: "rgba(116,192,252,0.15)",
  Junk: "rgba(134,142,150,0.10)",
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

const TYPE_ICONS: Record<string, string> = {
  Goddess: "👑",
  Demon: "😈",
};

const TYPE_COLORS: Record<string, string> = {
  Goddess: "#ffe066",
  Demon: "#9d6fff",
};

// ─── Tier order (S, A, B, C, Junk) ───────────────────────────────────────────

const TIER_LIST = ["S", "A", "B", "C", "Junk"];

function getTierKey(tier: string): string {
  // Normalize any tier name to S/A/B/C/Junk
  const upper = tier?.toUpperCase().split(" ")[0].trim() ?? "";
  if (upper === "S+" || upper === "SS" || upper === "SS+" || upper === "OP") return "S";
  if (upper === "A+" || upper === "A") return "A";
  if (upper === "B+" || upper === "B") return "B";
  if (upper === "C" || upper === "C+") return "C";
  // D, F, or anything unrecognized → Junk
  return "Junk";
}

function getTierNotes(tierlist: unknown): string | null {
  if (
    tierlist &&
    typeof tierlist === "object" &&
    "notes" in tierlist &&
    typeof tierlist.notes === "string"
  ) {
    return tierlist.notes;
  }

  return null;
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
  const notes = getTierNotes(tl);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,3,5,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0c1020", border: "1px solid rgba(100,80,200,0.25)", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(100,80,200,0.12)", position: "sticky", top: 0, background: "#0c1020", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 900, color: "#e8e0ff", margin: "0 0 8px 0" }}>{fellow.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "monospace", letterSpacing: 0.5, color: elemColor, border: `1px solid ${elemColor}44`, background: `${elemColor}11` }}>
                  {ELEMENT_ICONS[fellow.element] ?? "❓"} {fellow.element}
                </span>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: fellow.grade === "Demigod UR" ? "#9d6fff" : fellow.grade === "Collaboration UR" ? "#ff6b9d" : fellow.grade === "Limited UR" ? "#ffd43b" : fellow.grade === "SR" ? "#4dcc8a" : "#868e96" }}>
                  {fellow.grade}
                </span>
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
                Tierlist — Overall: <span style={{ color: TIER_COLORS[getTierKey(tl.overall)] ?? "#fff", fontWeight: 700 }}>{getTierKey(tl.overall)}</span>
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
                    <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#fff", background: TIER_COLORS[getTierKey(val ?? "")] ?? "#868e96" }}>
                      {getTierKey(val ?? "")}
                    </span>
                  </div>
                ))}
              </div>
              {notes && (
                <p style={{ margin: "8px 0 0 0", fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#7a6a9a", lineHeight: 1.5, fontStyle: "italic" }}>
                  💬 {notes}
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
  const notes = getTierNotes(tl);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,3,5,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0c1020", border: "1px solid rgba(100,80,200,0.25)", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(100,80,200,0.12)", position: "sticky", top: 0, background: "#0c1020", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 900, color: "#e8e0ff", margin: "0 0 8px 0" }}>{kupole.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "monospace", letterSpacing: 0.5, color: typeColor, border: `1px solid ${typeColor}44`, background: `${typeColor}11` }}>
                  {TYPE_ICONS[kupole.type] ?? "👤"} {kupole.type}
                </span>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: 0.5, color: "#fff", background: kupole.grade === "Limited UR" ? "#9d6fff" : "#4dcc8a" }}>
                  {kupole.grade}
                </span>
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
                <span style={{ color: TIER_COLORS[getTierKey(tl.overall)] ?? "#fff", fontWeight: 700, marginLeft: 8 }}>
                  {getTierKey(tl.overall)}
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
                    <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#fff", background: TIER_COLORS[getTierKey(val ?? "")] ?? "#868e96" }}>
                      {getTierKey(val ?? "")}
                    </span>
                  </div>
                ))}
              </div>
              {notes && (
                <p style={{ margin: "8px 0 0 0", fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#7a6a9a", lineHeight: 1.5, fontStyle: "italic" }}>
                  💬 {notes}
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

// ─── Soul Tide Compact Fellow Card ─────────────────────────────────────────

function FellowMiniCard({ fellow, onClick }: { fellow: Fellow; onClick: () => void }) {
  const elemColor = ELEMENT_COLORS[fellow.element] ?? "#9d6fff";
  const icon = ELEMENT_ICONS[fellow.element] ?? "👤";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        padding: "8px 6px 6px",
        borderRadius: 10,
        transition: "background 0.15s",
        minWidth: 64,
        maxWidth: 80,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${elemColor}18`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Portrait circle */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: `${elemColor}28`,
        border: `2px solid ${elemColor}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0,
        boxShadow: `0 0 12px ${elemColor}33`,
      }}>
        {icon}
      </div>
      {/* Name */}
      <div style={{
        fontFamily: "Sarabun, sans-serif",
        fontSize: 10,
        fontWeight: 600,
        color: "#c4b5e0",
        textAlign: "center",
        lineHeight: 1.2,
        maxWidth: 68,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {fellow.name}
      </div>
      {/* Element indicator */}
      <div style={{
        fontSize: 8,
        color: elemColor,
        fontFamily: "monospace",
        opacity: 0.8,
      }}>
        {fellow.element}
      </div>
    </div>
  );
}

// ─── Soul Tide Compact Kupole Card ──────────────────────────────────────────

function KupoleMiniCard({ kupole, onClick }: { kupole: Kupole; onClick: () => void }) {
  const typeColor = TYPE_COLORS[kupole.type] ?? "#9d6fff";
  const icon = TYPE_ICONS[kupole.type] ?? "👤";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        padding: "8px 6px 6px",
        borderRadius: 10,
        transition: "background 0.15s",
        minWidth: 64,
        maxWidth: 80,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${typeColor}18`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Portrait circle */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: `${typeColor}28`,
        border: `2px solid ${typeColor}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0,
        boxShadow: `0 0 12px ${typeColor}33`,
      }}>
        {icon}
      </div>
      {/* Name */}
      <div style={{
        fontFamily: "Sarabun, sans-serif",
        fontSize: 10,
        fontWeight: 600,
        color: "#c4b5e0",
        textAlign: "center",
        lineHeight: 1.2,
        maxWidth: 68,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {kupole.name}
      </div>
      {/* Type indicator */}
      <div style={{
        fontSize: 8,
        color: typeColor,
        fontFamily: "monospace",
        opacity: 0.8,
      }}>
        {kupole.type}
      </div>
    </div>
  );
}

// ─── Soul Tide Compact Tier Row ─────────────────────────────────────────────

function SoulTideTierRow({ tier, chars }: { tier: string; chars: React.ReactNode[] }) {
  if (chars.length === 0) return null;
  const color = TIER_COLORS[tier] ?? "#868e96";
  const bg = TIER_BG[tier] ?? "rgba(100,100,100,0.10)";

  const isJunk = tier === "Junk";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      marginBottom: 12,
      background: bg,
      borderRadius: 10,
      border: `1px solid ${color}33`,
      overflow: "hidden",
    }}>
      {/* Tier label on the left */}
      <div style={{
        width: 44,
        minWidth: 44,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isJunk ? "#495057" : color,
        padding: "8px 0",
        gap: 2,
      }}>
        <span style={{
          fontFamily: "Georgia, serif",
          fontSize: 18,
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1,
        }}>
          {tier}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: "stretch", background: `${color}33`, flexShrink: 0 }} />

      {/* Horizontal scroll of cards */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 4,
        padding: "8px 12px",
        overflowX: "auto",
        flex: 1,
        alignItems: "center",
        scrollbarWidth: "thin",
        scrollbarColor: `${color}44 transparent`,
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

  // Group fellows by normalized tier (S, A, B, C, Junk)
  const fellowsByTier = useMemo(() => {
    const map: Record<string, Fellow[]> = {
      S: [], A: [], B: [], C: [], Junk: [],
    };
    for (const f of fellowsData as Fellow[]) {
      if (!f.tierlist || !f.tierlist.overall) {
        map.Junk.push(f);
      } else {
        const tier = getTierKey(f.tierlist.overall);
        if (!map[tier]) map[tier] = [];
        map[tier].push(f);
      }
    }
    // Sort within each tier by rarity desc then name asc
    for (const t of Object.keys(map)) {
      map[t].sort((a, b) => (b.rarity ?? 0) - (a.rarity ?? 0) || a.name.localeCompare(b.name));
    }
    return map;
  }, []);

  // Group kupoles by normalized tier (S, A, B, C, Junk)
  const kupolesByTier = useMemo(() => {
    const map: Record<string, Kupole[]> = {
      S: [], A: [], B: [], C: [], Junk: [],
    };
    for (const k of kupoleData as Kupole[]) {
      if (!k.tierlist || !k.tierlist.overall || k.tierlist.overall.trim() === "") {
        // No tier data → Junk
        map.Junk.push(k);
      } else {
        const tier = getTierKey(k.tierlist.overall);
        if (!map[tier]) map[tier] = [];
        map[tier].push(k);
      }
    }
    for (const t of Object.keys(map)) {
      map[t].sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, []);

  const fellowCount = fellowsData.length;
  const kupoleCount = kupoleData.length;

  return (
    <>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
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
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "#3d3560", textTransform: "uppercase", marginBottom: 16 }}>
            Fellow Tier List · {fellowCount} Fellows
          </div>
          {TIER_LIST.map((tier) => {
            const chars = fellowsByTier[tier] ?? [];
            return (
              <SoulTideTierRow
                key={tier}
                tier={tier}
                chars={chars.map((f) => (
                  <FellowMiniCard
                    key={f.name}
                    fellow={f}
                    onClick={() => setSelectedFellow(f)}
                  />
                ))}
              />
            );
          })}
        </div>
      )}

      {/* Kupole Tier List */}
      {section === "kupoles" && (
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "#3d3560", textTransform: "uppercase", marginBottom: 16 }}>
            Kupole Tier List · {kupoleCount} Kupoles
          </div>
          {TIER_LIST.map((tier) => {
            const chars = kupolesByTier[tier] ?? [];
            return (
              <SoulTideTierRow
                key={tier}
                tier={tier}
                chars={chars.map((k) => (
                  <KupoleMiniCard
                    key={k.id}
                    kupole={k}
                    onClick={() => setSelectedKupole(k)}
                  />
                ))}
              />
            );
          })}
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
