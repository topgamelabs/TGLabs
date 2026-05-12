import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";

// =========================
// SLUG
// =========================
function generateSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^\wก-๙]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now().toString().slice(-6) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

// =========================
// PROMPTS
// =========================
const promptExtractFacts = (content: string) => `
สรุปข่าวนี้ให้อยู่ในรูปแบบ "โครงสร้างข่าว"

1. hook:
- สรุปข่าวสั้น

2. key_points:
- bullet สำคัญ

3. details:
- bullet รายละเอียด

4. impact:
- bullet สิ่งที่ควรรู้

ข้อมูล:
"""
${content}
"""
ข้อกำหนดเพิ่มเติม:
- ถ้ามี code / key / reward:
  → ต้องเก็บทุกตัว ห้ามตกหล่น
- ห้ามรวม code เป็นข้อความเดียว
- ต้องแยกเป็น bullet

ถ้ามี code / redeem code:
- ต้องแยกเป็น field:
  "codes": [
    { "value": "XXXX", "desc": "..." }
  ]
- ห้ามรวมกับ text

ตอบ JSON:
{
  "hook": "...",
  "key_points": ["..."],
  "details": ["..."],
  "impact": ["..."]
}
`;

const promptRewrite = (data: any) => `
คุณคือ "นักข่าวเกมมืออาชีพ"

[HOOK]
${data.hook || ""}

[KEY POINTS]
${(data.key_points || []).map((x: string) => `- ${x}`).join("\n")}

[DETAILS]
${(data.details || []).map((x: string) => `- ${x}`).join("\n")}

[IMPACT]
${(data.impact || []).map((x: string) => `- ${x}`).join("\n")}

[HIGHLIGHT RULES]
- ใช้ <strong> กับข้อมูลสำคัญ เช่น:
  - ตัวเลข
  - ชื่อเกม
  - feature ใหม่
- ใช้ <em> กับคำอธิบายหรือ insight
- ถ้ามี code / key / reward:
  → ต้องใส่ใน <code> หรือ <pre>
- ถ้ามีหลาย code:
  → แสดงเป็น list ชัดเจน
- ต้องมี 1 ส่วนที่เป็น "highlight box" เช่น:
  <blockquote>...</blockquote>

[CRITICAL DATA RULE]
- ห้ามตัดข้อมูลสำคัญ เช่น:
  - code
  - ตัวเลข
  - ชื่อ item / reward
- ถ้ามี code → ต้องแสดงครบ 100%
- ถ้ามีหลาย code → ต้องแยกเป็นรายการ

[FORMAT REQUIREMENTS]

- ต้องมี section นี้ถ้ามี code:

<h2>โค้ดทั้งหมด</h2>
<ul>
  <li><code>XXXX-XXXX</code> — คำอธิบาย</li>
</ul>

- ต้องมี highlight box อย่างน้อย 1 จุด:

<blockquote>
ข้อมูลสำคัญสรุปสั้น ๆ
</blockquote>

[STYLE UPGRADE]
- ห้ามเขียนแบบเรียบทั้งหมด
- ต้องมีการ:
  - เน้น (bold)
  - แทรก highlight
  - แยก section ชัด

  [HARD REQUIREMENTS - MUST FOLLOW]

1. ต้องใช้ HTML formatting:
- ใช้ <strong> อย่างน้อย 3 จุด
- ใช้ <em> อย่างน้อย 1 จุด
- ต้องมี <blockquote> อย่างน้อย 1 จุด

2. ถ้ามี code:
- ต้องแสดงใน <code>
- ห้ามหายแม้แต่ตัวเดียว
- ถ้ามีหลาย code → ต้องอยู่ใน <ul><li>

3. ถ้าไม่มี formatting ตามนี้ → คำตอบถือว่า "ผิด"

4. ห้ามส่ง content แบบ plain text

[CODE RENDER RULE]

ถ้ามี codes:
- ต้องมี section:

<h2>โค้ดทั้งหมด</h2>
<ul>
  ${(data.codes || [])
  .map((c: any) => `<li><code>${c.value}</code> - ${c.desc}</li>`)
  .join("")}
</ul>
- ถ้ามี code ที่ต้องใช้ทันที เช่น redeem code → ต้องแสดงใน <code> และมีคำอธิบายชัดเจน

เขียนข่าวให้:
- มี <h2>
- มี bullet list
- อ่านลื่นเหมือนเว็บข่าว
- ยาว 400-700 คำ

ตอบ JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "<p>...</p>",
  "seo_title": "...",
  "seo_description": "..."
}
`;

// =========================
// AI (มี timeout)
// =========================
async function generateAI(prompt: string, timeoutMs = 15000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error("AI ERROR:", await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";

    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("AI FAIL:", err);
    return null;
  }
}

// =========================
// UNIQUE HERO IMAGE
// =========================
// ใช้ slug เป็น seed แทน title เพื่อไม่ให้ภาพซ้ำกัน
function generateUniqueHeroImage(title: string, slug: string): string {
  // สร้าง seed จาก slug ที่มี random component อยู่แล้ว
  const seed = slug.split("-").slice(0, 3).join("-");
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/400`;
}

// ตรวจสอบว่า hero_image ซ้ำกับ article ที่มีอยู่แล้วหรือเปล่า (จาก source_url เดียวกัน)
async function isDuplicateHeroImage(heroImage: string, sourceUrl: string): Promise<boolean> {
  if (!heroImage || !sourceUrl) return false;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles?source_url=eq.${encodeURIComponent(sourceUrl)}&hero_image=eq.${encodeURIComponent(heroImage)}&select=id&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        next: { revalidate: 0 },
      }
    );

    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

// =========================
// SAFE
// =========================
function safe(data: any, fallbackTitle: string) {
  if (!data || !data.content) {
    return {
      title: fallbackTitle,
      excerpt: "",
      content: "<p>Content unavailable</p>",
      seo_title: fallbackTitle,
      seo_description: "",
    };
  }
  return data;
}

// =========================
// API
// =========================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // =========================
    // URL MODE
    // =========================
    if (body.mode === "url") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articleData = (await Promise.race([
        extract(body.url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("extract timeout")), 10000)
        ),
      ])) as any;

      if (!articleData?.content) {
        return NextResponse.json({ error: "extract failed" });
      }

      const content = articleData.content.slice(0, 8000);

      console.log("STEP 1: extract done");

      // 🔥 STEP 2: structured facts
      const structuredRaw = await generateAI(promptExtractFacts(content));
      console.log("STEP 2:", structuredRaw);

      let structured = structuredRaw;

      if (!structured || !structured.key_points?.length) {
        console.warn("FACT FAILED → fallback");

        structured = {
          hook: "",
          key_points: [content.slice(0, 500)],
          details: [],
          impact: [],
          codes: [], // 🔥 เพิ่มตรงนี้
        };
        if (!structured.codes) {
  structured.codes = [];
}
      }

      // 🔥 STEP 3: rewrite
      const newsRaw = await generateAI(promptRewrite(structured), 30000);
      console.log("STEP 3: rewrite done");

      const news = safe(newsRaw, "News");

      if (!news.title.includes("2026")) {
        news.title += " (อัปเดต 2026)";
      }

      // สร้าง slug ก่อนเพื่อใช้สำหรับ unique hero image
      const tempSlug = generateSlug(news.title);

      // ตรวจสอบว่า hero_image ซ้ำกับ article ที่มีอยู่แล้วหรือเปล่า
      let heroImage = articleData.image || null;
      if (heroImage) {
        const isDuplicate = await isDuplicateHeroImage(heroImage, body.url);
        if (isDuplicate) {
          console.log("Duplicate hero_image detected, using unique fallback");
          heroImage = null; // จะ fallback เป็น picsum แทน
        }
      }

      return NextResponse.json({
        success: true,
        articles: [
          {
            ...news,
            hero_image: heroImage,
            _tempSlug: tempSlug, // ส่ง slug ไปใช้ใน save mode
          },
        ],
        source_url: body.url,
      });
    }

    // =========================
    // SAVE MODE
    // =========================
    if (body.action === "save") {
      for (const article of body.articles) {
        const res = await fetch(
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
              ai_generated: true,
              source_url: body.source_url,
              seo_title: article.seo_title,
              seo_description: article.seo_description,
              hero_image:
                article.hero_image ||
                generateUniqueHeroImage(
                  article.title,
                  article._tempSlug || generateSlug(article.title)
                ),
            }),
          }
        );

        if (!res.ok) {
          console.error("SAVE ERROR:", await res.text());
          return NextResponse.json({ error: "save failed" });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "invalid request" });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: err.message });
  }
}