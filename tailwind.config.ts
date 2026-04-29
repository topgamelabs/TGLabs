import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tg-red": "#FF1A1A",
        "tg-dark-red": "#B30000",
        "tg-black": "#000000",
        "tg-surface": "#0A0A0A",
        "tg-surface-md": "#1F1F1F",
        "tg-surface-lg": "#2A2A2A",
        "tg-silver": "#E8E8E8",
        "tg-muted": "#CFCFCF",
        "tg-dim": "#888888",
        "tg-live": "#FF6B35",
        "tg-news": "#4A90D9",
        "tg-review": "#4DCC8A",
        "tg-tech": "#A855F7",
        "tg-tournament": "#FFD700",
      },
      fontFamily: {
        bebas: ["'Bebas Neue'", "'Anton'", "'Oswald'", "sans-serif"],
        kanit: ["'Kanit'", "'Prompt'", "sans-serif"],
        prompt: ["'Prompt'", "'Kanit'", "sans-serif"],
        inter: ["'Inter'", "'Segoe UI'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;