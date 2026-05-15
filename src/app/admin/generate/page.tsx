"use client";

import { useState } from "react";

interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  seo_title?: string;
  seo_description?: string;
  hero_image?: string | null;
  _tempSlug?: string;
}

type GenerateBody = {
  action: "generate";
  mode: "keyword" | "rewrite" | "url";
  url?: string;
  inputs?: string[];
};

export default function GeneratePage() {
  const [mode, setMode] = useState<"keyword" | "rewrite" | "url">("keyword");
  const [input, setInput] = useState("");
  const [source, setSource] = useState("");
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [loading, setLoading] = useState(false);

  // ========================
  // GENERATE
  // ========================
  const handleGenerating = async () => {
    setLoading(true);

    const body: GenerateBody = {
      action: "generate",
      mode,
    };

    if (mode === "url") {
      body.url = input;
    } else if (mode === "keyword") {
      body.inputs = input
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
    } else {
      body.inputs = [input];
    }

    const res = await fetch("/api/ai/generate-article", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tglabs-manual-tool": "admin-generate",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    setArticles(data.articles || []);
    if (data.source_url) setSource(data.source_url);

    setLoading(false);
  };

  // ========================
  // SAVE
  // ========================
  const handleSave = async () => {
    await fetch("/api/ai/generate-article", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tglabs-manual-tool": "admin-generate",
      },
      body: JSON.stringify({
        action: "save",
        articles,
        source_url: source,
      }),
    });

    alert("Saved to DB");
    setArticles([]);
  };

  // ========================
  // EDIT
  // ========================
  const updateField = (i: number, field: keyof GeneratedArticle, value: string) => {
    const updated = [...articles];
    updated[i][field] = value;
    setArticles(updated);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E8E8]">

      {/* HEADER */}
      <header className="border-b border-[#1F1F1F] px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">AI Generate</h1>
            <p className="text-sm text-[#888] mt-0.5">สร้างบทความอัตโนมัติ</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#4DCC8A]"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* MODE TABS */}
        <div className="flex gap-1 bg-[#111] p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setMode("keyword")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "keyword"
                ? "bg-[#FF1A1A] text-white"
                : "text-[#888] hover:text-white"
            }`}
          >
            Keyword
          </button>
          <button
            onClick={() => setMode("rewrite")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "rewrite"
                ? "bg-[#4A90D9] text-white"
                : "text-[#888] hover:text-white"
            }`}
          >
            Rewrite
          </button>
          <button
            onClick={() => setMode("url")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "url"
                ? "bg-[#A855F7] text-white"
                : "text-[#888] hover:text-white"
            }`}
          >
            URL
          </button>
        </div>

        {/* INPUT SECTION */}
        <div className="bg-[#111] rounded-xl p-6 mb-6">
          <label className="text-xs font-medium text-[#888] uppercase tracking-wider mb-3 block">
            {mode === "url" ? "URL" : mode === "keyword" ? "Keywords" : "Content"}
          </label>
          {mode === "url" ? (
            <input
              className="w-full p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#555] focus:border-[#FF1A1A] focus:outline-none transition-colors"
              placeholder="https://..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          ) : (
            <textarea
              className="w-full h-32 p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#555] focus:border-[#FF1A1A] focus:outline-none transition-colors resize-none"
              placeholder={
                mode === "keyword"
                  ? " พิมพ์ keyword แต่ละบรรทัด..."
                  : " วางเนื้อข่าวที่ต้องการ..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          )}

          {/* SOURCE */}
          <div className="mt-4">
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider mb-3 block">
              Source URL
            </label>
            <input
              className="w-full p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-[#555] focus:border-[#FF1A1A] focus:outline-none transition-colors"
              placeholder="https://..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <button
          onClick={handleGenerating}
          disabled={loading}
          className="w-full bg-[#FF1A1A] hover:bg-[#B30000] disabled:bg-[#333] text-white font-semibold py-3 rounded-lg transition-all mb-10"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              กำลังสร้าง...
            </span>
          ) : (
            "Generate"
          )}
        </button>

        {/* PREVIEW SECTION */}
        {articles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Preview & Edit</h2>
              <span className="text-xs text-[#888] bg-[#1F1F1F] px-3 py-1 rounded-full">
                {articles.length} บทความ
              </span>
            </div>

            {articles.map((a, i) => (
              <div
                key={i}
                className="bg-[#111] rounded-xl p-6 mb-6 border border-[#1F1F1F]"
              >
                {/* TITLE */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wider mb-2 block">
                    Title
                  </label>
                  <input
                    className="w-full p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:border-[#FF1A1A] focus:outline-none transition-colors"
                    value={a.title}
                    onChange={(e) => updateField(i, "title", e.target.value)}
                  />
                </div>

                {/* EXCERPT */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wider mb-2 block">
                    Excerpt
                  </label>
                  <textarea
                    className="w-full h-20 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:border-[#FF1A1A] focus:outline-none transition-colors resize-none"
                    value={a.excerpt}
                    onChange={(e) => updateField(i, "excerpt", e.target.value)}
                  />
                </div>

                {/* CONTENT */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wider mb-2 block">
                    Content
                  </label>
                  <textarea
                    className="w-full h-40 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:border-[#FF1A1A] focus:outline-none transition-colors resize-none"
                    value={a.content}
                    onChange={(e) => updateField(i, "content", e.target.value)}
                  />
                </div>

                {/* RENDER HTML */}
                <div className="border border-[#2A2A2A] rounded-lg p-4 bg-[#0A0A0A]">
                  <p className="text-xs text-[#666] mb-2">Preview</p>
                  <div
                    className="prose prose-invert max-w-none text-sm text-[#E8E8E8]"
                    dangerouslySetInnerHTML={{ __html: a.content }}
                  />
                </div>
              </div>
            ))}

            {/* SAVE BUTTON */}
            <button
              onClick={handleSave}
              className="w-full bg-[#4DCC8A] hover:bg-[#3AB872] text-black font-semibold py-3 rounded-lg transition-all"
            >
              Save to DB
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
