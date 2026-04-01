interface RuleProps {
  label: string;
}

export function Rule({ label }: RuleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
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
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(100,80,200,0.15)" }} />
    </div>
  );
}
