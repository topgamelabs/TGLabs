"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [mode, setMode] = useState<"keyword" | "rewrite" | "url">("keyword");
  const [input, setInput] = useState("");
  const [source, setSource] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ========================
  // GENERATE
  // ========================
  const handleGenerate = async () => {
    setLoading(true);

    let body: any = {
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
  const updateField = (i: number, field: string, value: string) => {
    const updated = [...articles];
    updated[i][field] = value;
    setArticles(updated);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Generate</h1>

        {/* MODE */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("keyword")}
            className={`px-4 py-2 rounded ${
              mode === "keyword"
                ? "bg-red-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            Keyword
          </button>

          <button
            onClick={() => setMode("rewrite")}
            className={`px-4 py-2 rounded ${
              mode === "rewrite"
                ? "bg-blue-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            Rewrite
          </button>

          <button
            onClick={() => setMode("url")}
            className={`px-4 py-2 rounded ${
              mode === "url"
                ? "bg-purple-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            URL
          </button>
        </div>

        {/* INPUT */}
        {mode === "url" ? (
          <input
            className="w-full p-3 bg-[#111] border border-gray-700 rounded mb-4"
            placeholder="วาง URL ข่าว"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        ) : (
          <textarea
            className="w-full h-40 p-4 bg-[#111] border border-gray-700 rounded mb-4"
            placeholder={
              mode === "keyword"
                ? "ใส่ keyword หลายบรรทัด"
                : "วางเนื้อข่าว"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}

        {/* SOURCE */}
        <input
          className="w-full p-3 bg-[#111] border border-gray-700 rounded mb-4"
          placeholder="Source URL (optional)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />

        {/* GENERATE BUTTON */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold mb-6"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {/* PREVIEW */}
        {articles.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Preview & Edit</h2>

            {articles.map((a, i) => (
              <div
                key={i}
                className="mb-8 p-5 bg-[#111] border border-gray-800 rounded"
              >
                {/* TITLE */}
                <input
                  className="w-full mb-2 p-2 bg-black border border-gray-700"
                  value={a.title}
                  onChange={(e) =>
                    updateField(i, "title", e.target.value)
                  }
                />

                {/* EXCERPT */}
                <textarea
                  className="w-full mb-3 p-2 bg-black border border-gray-700"
                  value={a.excerpt}
                  onChange={(e) =>
                    updateField(i, "excerpt", e.target.value)
                  }
                />

                {/* CONTENT */}
                <textarea
                  className="w-full h-40 p-2 bg-black border border-gray-700 mb-3"
                  value={a.content}
                  onChange={(e) =>
                    updateField(i, "content", e.target.value)
                  }
                />

                {/* RENDER HTML */}
                <div
                  className="prose prose-invert mt-4"
                  dangerouslySetInnerHTML={{ __html: a.content }}
                />
              </div>
            ))}

            {/* SAVE BUTTON */}
            <button
              onClick={handleSave}
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold"
            >
              Save to DB
            </button>
          </div>
        )}
      </div>
    </div>
  );
}