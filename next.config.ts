import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'bosstimer.tglabs.info' },
      { protocol: 'https', hostname: 'pegajhvjrldsdzfyppcv.supabase.co' },
    ],
  },
};

export default nextConfig;
