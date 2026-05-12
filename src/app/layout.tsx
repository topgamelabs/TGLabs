import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tglabs.info"),
  title: "TopGame Thailand - ข่าวเกมมือถือ อัปเดตล่าสุด",
  description:
    "รวมข่าวเกมมือถือ อัปเดตใหม่ รีวิว เทคนิค และ Tier List ครบทุกเกมดังในไทย",
  keywords: [
    "เกมมือถือ",
    "ข่าวเกม",
    "Ragnarok",
    "ROV",
    "Genshin Impact",
    "Mobile Legends",
  ],
  openGraph: {
    title: "TopGame Thailand",
    description: "ข่าวเกมมือถือ อัปเดตไว ครบทุกเกมดัง",
    url: "https://tglabs.info",
    siteName: "TopGame Thailand",
    type: "website",
    images: "https://pegajhvjrldsdzfyppcv.supabase.co/storage/v1/object/public/images/TopGame_hero.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "TopGame Thailand",
    description: "ข่าวเกมมือถือ อัปเดตไว ครบทุกเกมดัง",
    images: "https://pegajhvjrldsdzfyppcv.supabase.co/storage/v1/object/public/images/TopGame_hero.png",
  },
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
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-SS8YJ0SRNB" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-SS8YJ0SRNB');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}