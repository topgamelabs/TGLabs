import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopGame Thailand — Gaming Media Platform",
  description: "สื่อเกมเพื่อเกมเมอร์ไทย ข่าวเกม รีวิว เทคนิค และข้อมูลเกมมือถือ PC Console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Kanit:wght@400;500;600;700;800&family=Prompt:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}