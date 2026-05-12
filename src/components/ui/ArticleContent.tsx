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
    />
  );
}
