const TAG_COLOR = {
  buff: { bg: "rgba(77,204,138,0.15)", c: "#4dcc8a", b: "rgba(77,204,138,0.3)" },
  nerf: { bg: "rgba(255,92,122,0.15)", c: "#ff5c7a", b: "rgba(255,92,122,0.3)" },
  new: { bg: "rgba(90,180,255,0.15)", c: "#5ab4ff", b: "rgba(90,180,255,0.3)" },
  event: { bg: "rgba(201,168,76,0.15)", c: "#c9a84c", b: "rgba(201,168,76,0.3)" },
  fix: { bg: "rgba(157,111,255,0.15)", c: "#9d6fff", b: "rgba(157,111,255,0.3)" },
} as const;

type TagType = keyof typeof TAG_COLOR;

interface PTagProps {
  label: string;
  type?: TagType;
}

export function PTag({ label, type = "fix" }: PTagProps) {
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
