"use client";

interface AdPlaceholderProps {
  width: number;
  height: number;
}

export function AdPlaceholder({ width, height }: AdPlaceholderProps) {
  return (
    <div
      className="ad-placeholder"
      style={{
        width: width,
        height: height,
      }}
    >
      <span className="ad-placeholder-label">AD SLOT</span>
      <span className="ad-placeholder-size">{width} x {height}</span>
    </div>
  );
}