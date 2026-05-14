import React from "react";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export default function ArticleContent({ content, className }: ArticleContentProps) {
  return (
    <div
      className={className || "article-content"}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        // Style HTML bullet lists to match JSON block red border style
        "--bullet-border": "#FF1A1A",
        "--bullet-bg": "rgba(255,26,26,0.05)",
      } as React.CSSProperties}
    />
  );
}