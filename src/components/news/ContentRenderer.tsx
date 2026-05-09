import React from "react";

// PTag
const TAG_COLOR: Record<string, { bg: string; c: string; b: string }> = {
  buff: { bg: "rgba(77,204,138,0.15)", c: "#4dcc8a", b: "rgba(77,204,138,0.3)" },
  nerf: { bg: "rgba(255,92,122,0.15)", c: "#ff5c7a", b: "rgba(255,92,122,0.3)" },
  new: { bg: "rgba(90,180,255,0.15)", c: "#5ab4ff", b: "rgba(90,180,255,0.3)" },
  event: { bg: "rgba(201,168,76,0.15)", c: "#c9a84c", b: "rgba(201,168,76,0.3)" },
  fix: { bg: "rgba(157,111,255,0.15)", c: "#9d6fff", b: "rgba(157,111,255,0.3)" },
};

export function PTag({ label, type = "fix" }: { label: string; type?: string }) {
  const s = TAG_COLOR[type] || TAG_COLOR.fix;
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 10,
        letterSpacing: 1,
        padding: "2px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.c,
        border: `1px solid ${s.b}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// Rule
export function Rule({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: 3,
          color: "#3d3560",
          textTransform: "uppercase" as const,
          whiteSpace: "nowrap" as const,
        }}
      >
        {label || "—"}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
    </div>
  );
}

// InlineImage
export function InlineImage({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  return (
    <figure style={{ margin: "24px 0" }}>
      <img
        src={src}
        alt={caption || ""}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      {caption && (
        <figcaption
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#666",
            textAlign: "center" as const,
            fontStyle: "italic",
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Content Block Types
export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "bullet"
  | "quote"
  | "rule"
  | "ptag";

export interface ContentBlock {
  type: BlockType;
  content?: string;
  level?: 1 | 2 | 3;
  imageUrl?: string;
  imageCaption?: string;
  items?: string[];
  label?: string;
  tagType?: "buff" | "nerf" | "new" | "event" | "fix";
  tagLabel?: string;
}

// Render single block
function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.85)",
            marginBottom: 16,
          }}
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );

    case "heading": {
      const level = block.level || 2;
      const sizes: Record<number, string> = {
        1: "24px",
        2: "20px",
        3: "17px",
      };
      return (
        <div
          style={{
            fontFamily: "'Kanit', sans-serif",
            fontSize: sizes[level],
            fontWeight: 700,
            color: "#fff",
            marginTop: 32,
            marginBottom: 12,
            lineHeight: 1.3,
          }}
        >
          {block.content}
        </div>
      );
    }

    case "image":
      return (
        <InlineImage
          src={block.imageUrl || ""}
          caption={block.imageCaption}
        />
      );

    case "bullet":
      return (
        <ul
          style={{
            margin: "16px 0",
            paddingLeft: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {(block.items || []).map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
                listStyleType: "disc",
              }}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          ))}
        </ul>
      );

    case "quote":
      return (
        <blockquote
          style={{
            margin: "24px 0",
            padding: "16px 20px",
            borderLeft: "3px solid #FF1A1A",
            background: "rgba(255,26,26,0.05)",
            borderRadius: "0 8px 8px 0",
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.8)",
            fontStyle: "italic",
          }}
        >
          {block.content}
        </blockquote>
      );

    case "rule":
      return <Rule label={block.label} />;

    case "ptag":
      return (
        <div style={{ margin: "16px 0" }}>
          <PTag
            label={block.tagLabel || block.label || ""}
            type={block.tagType}
          />
        </div>
      );

    default:
      return null;
  }
}

// ContentRenderer — renders array of ContentBlocks
export function ContentRenderer({
  blocks,
  className,
}: {
  blocks: ContentBlock[];
  className?: string;
}) {
  return (
    <div className={className}>
      {(blocks || []).map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

// Default export
export default ContentRenderer;