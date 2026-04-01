import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGLabs - ศูนย์รวมข้อมูลเกมมือถือ",
  description: "ศูนย์รวมข้อมูลเกมมือถือครบในที่เดียว — Tier List, Patch Notes, Tips & Guides, Character DB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
