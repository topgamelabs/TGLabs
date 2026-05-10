"use client";

export function ShareButtons({ url }: { url: string }) {
  return (
    <div className="flex gap-2 ml-auto">
      {/* Facebook */}
      <button
        onClick={() => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        }}
        className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 transition-colors"
        title="Share on Facebook"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>

      {/* X (Twitter) */}
      <button
        onClick={() => {
          window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(document.title)}`, "_blank");
        }}
        className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-colors"
        title="Share on X"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      {/* Instagram */}
      <button
        onClick={() => window.open("https://www.instagram.com/", "_blank")}
        className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-gradient-to-br hover:from-[#833AB4]/20 hover:via-[#E1306C]/20 hover:to-[#F77737]/20 hover:border-[#E1306C]/50 transition-colors"
        title="Share on Instagram"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#833AB4"/>
              <stop offset="50%" stopColor="#E1306C"/>
              <stop offset="100%" stopColor="#F77737"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      </button>

      {/* Copy Link */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
        }}
        className="w-8 h-8 rounded-md bg-[#0D0D0D] border border-white/[0.06] flex items-center justify-center hover:bg-[#FF1A1A]/10 hover:border-[#FF1A1A]/50 transition-colors"
        title="Copy Link"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>
    </div>
  );
}