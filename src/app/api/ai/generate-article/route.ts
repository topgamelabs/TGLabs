import { NextResponse } from "next/server";

function generateSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\wก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const unique = Date.now().toString().slice(-6);
  return `${base}-${unique}`;
}

const promptKeyword = (input: string) => `
คุณคือนักข่าวเกมมืออาชีพ

เขียนข่าวจากหัวข้อนี้:
"${input}"

- ห้ามแต่งข้อมูลมั่ว
- เขียนเหมือนข่าวจริง
- มี <h2> อย่างน้อย 2
- มี bullet list

ตอบ JSON:
{ "title": "...", "excerpt": "...", "content": "<p>...</p>" }
`;

const promptRewrite = (content: string) => `
คุณคือนักข่าวเกมมืออาชีพ

เรียบเรียงข่าวจากข้อมูลนี้:

"""
${content}
"""

ข้อกำหนด:
- rewrite ใหม่ทั้งหมด ห้าม copy
- ห้ามแต่งข้อมูลเพิ่ม
- เขียนเหมือน "สรุปข่าว"

- มี <h2> อย่างน้อย 2
- มี bullet list

ตอนท้ายต้องมี:
"ข้อมูลอ้างอิงจากแหล่งข่าวต้นฉบับ"

ตอบ JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "<p>...</p>"
}
`;

async function generateAI(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const action = body.action || "generate";
    const mode = body.mode || "keyword";

    // ========================
    // GENERATE
    // ========================
    if (action === "generate") {
      const inputs: string[] = body.inputs || [];
      const results = [];

      for (const input of inputs) {
        const prompt =
          mode === "rewrite"
            ? promptRewrite(input)
            : promptKeyword(input);

        const article = await generateAI(prompt);
        results.push(article);
      }

      return NextResponse.json({ success: true, articles: results });
    }

    // ========================
    // SAVE
    // ========================
    if (action === "save") {
      const articles = body.articles || [];
      const source_url = body.source_url || null;

      for (const article of articles) {
        const resInsert = await fetch(
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
              status: "draft",
              ai_generated: true,
              source_url: source_url,
            }),
          }
        );

        console.log("SAVE STATUS:", resInsert.status);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}