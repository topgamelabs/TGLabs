import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  allowedDevOrigins: ['156.67.217.207'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'bosstimer.tglabs.info' },
      { protocol: 'https', hostname: 'pegajhvjrldsdzfyppcv.supabase.co' },
    ],
  },
};

export default nextConfig;
