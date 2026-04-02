"use client";

import React, { useState, useMemo, useEffect } from "react";
import fellowsData from "@/data/fellows-db.json";

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

type Fellow = typeof fellowsData[number];

const ELEMENTS = ["All", "Fire", "Ice", "Lightning", "Earth", "Dark", "Holy", "Multi"];
const GRADES = ["All", "Demigod UR", "Collaboration UR", "Limited UR", "SR", "R"];
const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
  { value: "rarity-desc", label: "Rarity (High→Low)" },
  { value: "rarity-asc", label: "Rarity (Low→High)" },
];

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

const GRADE_COLORS: Record<string, string> = {
  "Demigod UR": "#9d6fff",
  "Collaboration UR": "#ff6b9d",
  "Limited UR": "#ffd43b",
  "SR": "#4dcc8a",
  "R": "#868e96",
};

const TIER_COLORS: Record<string, string> = {
  "S+": "#ff6b6b",
  S: "#ff8787",
  "A+": "#ffa94d",
  A: "#ffd43b",
  "B+": "#8ce99a",
  B: "#69db7c",
  C: "#74c0fc",
  D: "#868e96",
};

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
      color: color,
      border: `1px solid ${color}44`,
      background: `${color}11`,
    }}>
      {icon} {element}
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
      }}>
        {desc}
      </p>
    </div>
  );
}

function FellowModal({ fellow, onClose }: { fellow: Fellow; onClose: () => void }) {
  const tl = fellow.tierlist;
  const isDemigod = fellow.grade === "Demigod UR";

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
          maxWidth: 680,
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
                {fellow.name}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <ElementBadge element={fellow.element} />
                <GradeBadge grade={fellow.grade} />
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#5a5478", letterSpacing: 1 }}>
                  {fellow.classInfo}
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
            {tl.notes && (
              <p style={{
                margin: "8px 0 0 0",
                fontFamily: "Sarabun, sans-serif",
                fontSize: 11,
                color: "#7a6a9a",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}>
                💬 {tl.notes}
              </p>
            )}
          </div>

          {/* Leader Skill (Demigod only) */}
          {isDemigod && fellow.leaderSkill && (
            <div style={{ marginBottom: 16 }}>
              <SkillRow label="Leader Skill" desc={fellow.leaderSkill} />
            </div>
          )}

          {/* Skills */}
          <div style={{ marginBottom: 16 }}>
            <SkillRow label="Basic Attack" desc={fellow.basicAttack} />
            <SkillRow label="Skill 1" desc={fellow.skill1} />
            <SkillRow label="Skill 2" desc={fellow.skill2} />
            <SkillRow label="Skill 3" desc={fellow.skill3} />
            <SkillRow label="Awaken Skill" desc={fellow.awakenSkill} />
          </div>

          {/* Info footer */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: "12px 14px",
            background: "#080b18",
            borderRadius: 8,
            border: "1px solid rgba(100,80,200,0.1)",
          }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Obtain</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>{fellow.obtainFrom}</div>
            </div>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Bonus</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#a89cc8" }}>{fellow.acquireBonus}</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: "#3d3560", textTransform: "uppercase", marginBottom: 3 }}>Max Rank Materials</div>
              <div style={{ fontFamily: "Sarabun, sans-serif", fontSize: 11, color: "#4dcc8a" }}>{fellow.requiredMats}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FellowCard({ fellow, onClick }: { fellow: Fellow; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const elemColor = ELEMENT_COLORS[fellow.element] ?? "#9d6fff";
  const gradeColor = GRADE_COLORS[fellow.grade] ?? "#868e96";

  return (
    <div
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        background: hovered ? "#111828" : "#0c1020",
        border: `1px solid ${hovered ? elemColor + "44" : "rgba(100,80,200,0.15)"}`,
        borderRadius: 14,
        padding: 20,
        textAlign: "center",
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "scale(1.04)" : "scale(1)",
        boxShadow: hovered ? `0 6px 24px ${elemColor}22` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Element glow accent */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${elemColor}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s",
      }} />

      {/* Portrait placeholder */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${elemColor}22, ${gradeColor}22)`,
        border: `1px solid ${elemColor}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px",
        fontSize: 36,
        position: "relative",
      }}>
        <span style={{ opacity: 0.9 }}>{ELEMENT_ICONS[fellow.element] ?? "👤"}</span>
        {/* Rarity stars */}
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
        {fellow.name}
      </div>

      {/* Element */}
      <div style={{ marginBottom: 6 }}>
        <ElementBadge element={fellow.element} />
      </div>

      {/* Grade */}
      <div>
        <GradeBadge grade={fellow.grade} />
      </div>
    </div>
  );
}

export function FellowsPanel(): React.JSX.Element {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("rarity-desc");
  const [selectedFellow, setSelectedFellow] = useState<Fellow | null>(null);

  const filtered = useMemo(() => {
    let list = [...fellowsData] as Fellow[];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    if (elementFilter !== "All") {
      list = list.filter((f) => f.element === elementFilter);
    }
    if (gradeFilter !== "All") {
      list = list.filter((f) => f.grade === gradeFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "rarity-desc") return b.rarity - a.rarity;
      if (sortBy === "rarity-asc") return a.rarity - b.rarity;
      return 0;
    });

    return list;
  }, [search, elementFilter, gradeFilter, sortBy]);

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
            Fellow Database — {fellowsData.length} Fellows
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
              Element
            </div>
            <FilterPill options={ELEMENTS} value={elementFilter} onChange={setElementFilter} />
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
          Showing {filtered.length} of {fellowsData.length} fellows
        </div>

        {/* Grid - responsive: 1 col on mobile, auto-fill on desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))",
            gap: isMobile ? 10 : 14,
          }}
        >
          {filtered.map((f) => (
            <FellowCard
              key={f.name}
              fellow={f}
              onClick={() => setSelectedFellow(f)}
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
            No fellows found matching your filters.
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedFellow && (
        <FellowModal fellow={selectedFellow} onClose={() => setSelectedFellow(null)} />
      )}
    </>
  );
}
