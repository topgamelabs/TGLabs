"use client";

import React, { useState, useMemo, useEffect } from "react";
import kupoleData from "@/data/kupole-db.json";

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

type Kupole = {
  id: string;
  name: string;
  grade: string;
  type: string;
  obtainFrom: string;
  rankBonus: string;
  bondBonus: string;
  passiveSkill: string;
  activeSkill: string;
  rankUnlock: string[];
  tierlist: {
    damageBuff: string;
    survival: string;
    utility: string;
    partyBuff: string;
    overall: string;
  };
  notes: string;
};

const TYPES = ["All", "Goddess", "Demon"];
const GRADES = ["All", "Limited UR", "UR"];
const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
  { value: "grade-desc", label: "Grade (High→Low)" },
  { value: "grade-asc", label: "Grade (Low→High)" },
  { value: "tier-desc", label: "Overall Tier (High→Low)" },
];

const TIER_ORDER: Record<string, number> = {
  "OP": 0,
  "SS": 1,
  "S+": 2,
  "S": 3,
  "A+": 4,
  "A": 5,
  "B": 6,
  "C": 7,
  "F": 8,
};

const TIER_COLORS: Record<string, string> = {
  "OP": "#ff6b6b",
  "SS": "#9d6fff",
  "S+": "#ff8787",
  "S": "#ffa94d",
  "A+": "#ffd43b",
  "A": "#8ce99a",
  "B": "#69db7c",
  "C": "#74c0fc",
  "F": "#868e96",
};

const TYPE_COLORS: Record<string, string> = {
  Goddess: "#ffe066",
  Demon: "#9d6fff",
};

const GRADE_COLORS: Record<string, string> = {
  "Limited UR": "#9d6fff",
  "UR": "#4dcc8a",
};

function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? "#868e96";
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
      {tier}
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
      color: color,
      border: `1px solid ${color}44`,
      background: `${color}11`,
    }}>
      {type === "Goddess" ? "✨" : "😈"} {type}
    </span>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const color = GRADE_COLORS[grade] ?? "#868e96";
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

function SkillRow({ label, desc }: { label: string; desc: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(desc).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: "#9d6fff",
          textTransform: "uppercase",
        }}>
          {label}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 10,
            color: copied ? "#4dcc8a" : "#3d3560",
            fontFamily: "monospace",
            transition: "color 0.2s",
          }}
        >
          {copied ? "✓ copied" : "📋 copy"}
        </button>
      </div>
      <p style={{
        fontFamily: "Sarabun, sans-serif",
        fontSize: 12,
        lineHeight: 1.6,
        color: "#c4b5e0",
        margin: 0,
        padding: "8px 10px",
        background: "#0a0d1a",
        borderRadius: 6,
        border: "1px solid rgba(100,80,200,0.1)",
        whiteSpace: "pre-wrap",
      }}>
        {desc}
      </p>
    </div>
  );
}

function KupoleModal({ kupole, onClose }: { kupole: Kupole; onClose: () => void }) {
  const typeColor = TYPE_COLORS[kupole.type] ?? "#9d6fff";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(2,3,5,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c1020",
          border: "1px solid rgba(100,80,200,0.25)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(100,80,200,0.12)",
          position: "sticky",
          top: 0,
          background: "#0c1020",
          zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: "Georgia, serif",
                fontSize: 22,
                fontWeight: 900,
                color: "#e8e0ff",
                margin: "0 0 8px 0",
              }}>
                {kupole.name}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <TypeBadge type={kupole.type} />
                <GradeBadge grade={kupole.grade} />
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#5a5478", letterSpacing: 1 }}>
                  {kupole.obtainFrom}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(100,80,200,0.12)",
                border: "1px solid rgba(100,80,200,0.2)",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#8878aa",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {/* Tierlist */}
          <div style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#080b18",
            border: "1px solid rgba(100,80,200,0.15)",
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: 2,
              color: "#3d3560",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>
              Tierlist — Overall:
              <span style={{ color: TIER_COLORS[kupole.tierlist.overall] ?? "#fff", fontWeight: 700, marginLeft: 8 }}>
                {kupole.tierlist.overall}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                ["⚔️ DMG", kupole.tierlist.damageBuff],
                ["🛡️ SURV", kupole.tierlist.survival],
                ["🔧 UTIL", kupole.tierlist.utility],
                ["🏥 P.BUFF", kupole.tierlist.partyBuff],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 8px",
                  background: "#0c1020",
                  borderRadius: 4,
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "#8878aa", letterSpacing: 0.5 }}>{label}</span>
                  <TierBadge tier={val} />
                </div>
              ))}
            </div>
          </div>

          {/* Bonus Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}>
            <div style={{
              padding: "10px 12px",
              background: "#080b18",
              borderRadius: 8,
              border: "1px solid rgba(100,80,200,0.1)",
            }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 4 }}>
                Rank Bonus
              </div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>
                {kupole.rankBonus || "-"}
              </div>
            </div>
            <div style={{
              padding: "10px 12px",
              background: "#080b18",
              borderRadius: 8,
              border: "1px solid rgba(100,80,200,0.1)",
            }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 4 }}>
                Bond Bonus
              </div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>
                {kupole.bondBonus || "-"}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 16 }}>
            <SkillRow label="Passive Skill" desc={kupole.passiveSkill} />
            <SkillRow label="Active Skill" desc={kupole.activeSkill} />
          </div>

          {/* Rank Unlock Effects */}
          {kupole.rankUnlock.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: "#9d6fff",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>
                Rank Unlock Effects
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 6,
              }}>
                {kupole.rankUnlock.map((effect, i) => (
                  <div key={i} style={{
                    padding: "6px 10px",
                    background: "#0a0d1a",
                    borderRadius: 6,
                    border: "1px solid rgba(100,80,200,0.1)",
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "#4dcc8a",
                  }}>
                    R{i + 2}: {effect.substring(0, 60)}{effect.length > 60 ? "..." : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {kupole.notes && (
            <div style={{
              padding: "12px 14px",
              background: "#080b18",
              borderRadius: 8,
              border: "1px solid rgba(100,80,200,0.1)",
            }}>
              <div style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: 1.5,
                color: "#3d3560",
                textTransform: "uppercase",
                marginBottom: 6,
              }}>
                Notes
              </div>
              <p style={{
                fontFamily: "Sarabun, sans-serif",
                fontSize: 12,
                lineHeight: 1.6,
                color: "#a89cc8",
                margin: 0,
                fontStyle: "italic",
              }}>
                {kupole.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KupoleCard({ kupole, onClick }: { kupole: Kupole; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const typeColor = TYPE_COLORS[kupole.type] ?? "#9d6fff";
  const gradeColor = GRADE_COLORS[kupole.grade] ?? "#868e96";
  const tierColor = TIER_COLORS[kupole.tierlist.overall] ?? "#868e96";

  return (
    <div
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        background: hovered ? "#111828" : "#0c1020",
        border: `1px solid ${hovered ? typeColor + "44" : "rgba(100,80,200,0.15)"}`,
        borderRadius: 14,
        padding: 20,
        textAlign: "center",
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "scale(1.04)" : "scale(1)",
        boxShadow: hovered ? `0 6px 24px ${typeColor}22` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent glow */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${typeColor}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s",
      }} />

      {/* Icon placeholder */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${typeColor}22, ${gradeColor}22)`,
        border: `1px solid ${typeColor}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px",
        fontSize: 36,
      }}>
        {kupole.type === "Goddess" ? "✨" : "😈"}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 13,
        fontWeight: 700,
        color: "#e8e0ff",
        marginBottom: 8,
        lineHeight: 1.2,
        minHeight: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {kupole.name}
      </div>

      {/* Type & Grade */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 6 }}>
        <TypeBadge type={kupole.type} />
      </div>

      {/* Grade */}
      <div style={{ marginBottom: 6 }}>
        <GradeBadge grade={kupole.grade} />
      </div>

      {/* Overall Tier */}
      <div>
        <TierBadge tier={kupole.tierlist.overall} />
      </div>
    </div>
  );
}

export function KupolePanel(): React.JSX.Element {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("tier-desc");
  const [selectedKupole, setSelectedKupole] = useState<Kupole | null>(null);

  const filtered = useMemo(() => {
    let list = [...kupoleData] as Kupole[];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((k) => k.name.toLowerCase().includes(q));
    }
    if (typeFilter !== "All") {
      list = list.filter((k) => k.type === typeFilter);
    }
    if (gradeFilter !== "All") {
      list = list.filter((k) => k.grade === gradeFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "grade-desc") return b.grade.localeCompare(a.grade);
      if (sortBy === "grade-asc") return a.grade.localeCompare(b.grade);
      if (sortBy === "tier-desc") {
        const aTier = TIER_ORDER[a.tierlist.overall] ?? 99;
        const bTier = TIER_ORDER[b.tierlist.overall] ?? 99;
        return aTier - bTier;
      }
      return 0;
    });

    return list;
  }, [search, typeFilter, gradeFilter, sortBy]);

  const FilterPill = ({
    options,
    value,
    onChange,
  }: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: `1px solid ${value === opt ? "#9d6fff44" : "rgba(100,80,200,0.15)"}`,
            background: value === opt ? "rgba(157,111,255,0.15)" : "transparent",
            color: value === opt ? "#c4a0ff" : "#5a5478",
            fontFamily: "monospace",
            fontSize: 10,
            cursor: "pointer",
            letterSpacing: 0.5,
            transition: "all 0.15s",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div>
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
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
            Kupole Database — {kupoleData.length} Kupoles
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
        </div>

        {/* Controls */}
        <div
          style={{
            background: "#080b18",
            border: "1px solid rgba(100,80,200,0.12)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          {/* Search */}
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 14px",
                background: "#0c1020",
                border: "1px solid rgba(100,80,200,0.2)",
                borderRadius: 8,
                color: "#e8e0ff",
                fontFamily: "Sarabun, sans-serif",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1.5, color: "#3d3560", textTransform: "uppercase", marginBottom: 6 }}>
              Type
            </div>
            <FilterPill options={TYPES} value={typeFilter} onChange={setTypeFilter} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1.5, color: "#3d3560", textTransform: "uppercase", marginBottom: 6 }}>
              Grade
            </div>
            <FilterPill options={GRADES} value={gradeFilter} onChange={setGradeFilter} />
          </div>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1.5, color: "#3d3560", textTransform: "uppercase" }}>
              Sort
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: "#0c1020",
                border: "1px solid rgba(100,80,200,0.2)",
                borderRadius: 6,
                color: "#c4a0ff",
                fontFamily: "monospace",
                fontSize: 10,
                padding: "4px 8px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: "#3d3560",
          marginBottom: 14,
          letterSpacing: 1,
        }}>
          Showing {filtered.length} of {kupoleData.length} kupoles
        </div>

        {/* Grid - responsive: 1 col on mobile, auto-fill on desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))",
            gap: isMobile ? 10 : 14,
          }}
        >
          {filtered.map((k) => (
            <KupoleCard
              key={k.id}
              kupole={k}
              onClick={() => setSelectedKupole(k)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "48px 0",
            color: "#3d3560",
            fontFamily: "monospace",
            fontSize: 12,
            letterSpacing: 1,
          }}>
            No kupoles found matching your filters.
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedKupole && (
        <KupoleModal kupole={selectedKupole} onClose={() => setSelectedKupole(null)} />
      )}
    </>
  );
}
