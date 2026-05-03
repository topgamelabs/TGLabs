import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";
import * as cheerio from "cheerio";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\wก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =========================
// 🔥 SMART EXTRACTOR
// =========================
function extractMainContent(html: string, url: string) {
  const $ = cheerio.load(html);

  // ลบ noise
  $("script, style, nav, footer, header, aside").remove();

  let content = "";

  // 🔥 site-specific (แม่นสุด)
  if (url.includes("netmarble.com")) {
    content = $(".view_content").text();
  }

  // 🔥 fallback generic
  if (!content) {
    content =
      $("article").text() ||
      $(".content").text() ||
      $(".post").text() ||
      $("main").text() ||
      $("body").text();
  }

  // clean text
  content = content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  return content;
}

// =========================
// 🔥 PROMPT
// =========================
const promptRewrite = (content: string) => `
คุณคือนักเขียนข่าวเกมมืออาชีพ

# TASK
เรียบเรียงข่าวใหม่จากข้อมูลด้านล่าง

# STYLE
- เขียนให้อ่านง่าย เป็นธรรมชาติ
- มีความเป็น storyteller เล็กน้อย

# RULES
- ห้าม copy
- ห้ามแต่งข้อมูล
- ถ้าข้อมูลไม่พอ ให้สรุปเท่าที่มี

# OUTPUT
ตอบ JSON เท่านั้น:
{
  "title": "...",
  "excerpt": "...",
  "content": "<h2>...</h2><p>...</p><ul>...</ul>"
}

# SOURCE
"""
${content}
"""
`;

const promptKeyword = (keyword: string) => `
คุณคือนักข่าวเกมมืออาชีพ

เขียนบทความจาก keyword นี้:
"${keyword}"

- มี <h2> อย่างน้อย 2
- มี bullet list
- ห้ามแต่งข้อมูลมั่ว

ตอบ JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "<h2>...</h2><p>...</p><ul>...</ul>"
}
`;

// =========================
// 🔥 AI CALL
// =========================
async function generateAI(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON. No explanation.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json();

  console.log("STATUS:", res.status);
  console.log("AI FULL:", JSON.stringify(data, null, 2));

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI empty response");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON PARSE FAIL:", text);

    return {
      title: "AI Parse Error",
      excerpt: "",
      content: `<p>${text}</p>`,
    };
  }
}

// =========================
// 🔥 ROUTE
// =========================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    // =========================
    // 🔥 URL MODE
    // =========================
    if (body.mode === "url" || body.url) {
      let content = "";
      let image = null;

      // 🔹 พยายาม extract ปกติ
      try {
        const articleData = await extract(body.url);
        content = articleData?.content || "";
        image = articleData?.image || null;
      } catch (e) {
        console.log("extract error:", e);
      }

      // 🔥 FALLBACK → SMART EXTRACT
      if (!content) {
        console.log("FALLBACK: smart extractor");

        const res = await fetch(body.url);
        const html = await res.text();

        content = extractMainContent(html, body.url);
      }

      console.log("CONTENT LENGTH:", content.length);

      if (!content || content.length < 50) {
        return NextResponse.json(
          { error: "content extraction failed" },
          { status: 400 }
        );
      }

      const ai = await generateAI(promptRewrite(content));

      return NextResponse.json({
        success: true,
        articles: [
          {
            ...ai,
            hero_image: image,
          },
        ],
        source_url: body.url,
      });
    }

    // =========================
    // 🔥 KEYWORD MODE
    // =========================
    if (body.mode === "keyword") {
      const keyword = body.inputs?.[0];

      if (!keyword) {
        return NextResponse.json(
          { error: "keyword missing" },
          { status: 400 }
        );
      }

      const ai = await generateAI(promptKeyword(keyword));

      return NextResponse.json({
        success: true,
        articles: [ai],
        source_url: null,
      });
    }

    // =========================
    // 🔥 SAVE
    // =========================
    if (body.action === "save") {
      for (const article of body.articles) {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              title: article.title,
              excerpt: article.excerpt,
              content: article.content,
              slug: generateSlug(article.title),
              category: "news",
              author_id: "33333333-3333-3333-3333-333333333333",

              status: "published",
              is_published: true,
              published_at: new Date().toISOString(),

              ai_generated: true,
              source_url: body.source_url,

              hero_image:
                article.hero_image ||
                `https://picsum.photos/seed/${encodeURIComponent(
                  article.title
                )}/800/400`,
            }),
          }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "invalid request", body },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("ERROR:", err);
    return NextResponse.json({ error: err.message });
  }
}