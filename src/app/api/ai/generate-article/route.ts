import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";

function generateSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^\wก-๙]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now().toString().slice(-6)
  );
}

const promptRewrite = (content: string) => `
คุณคือนักข่าวเกมมืออาชีพ

เรียบเรียงข่าวจากข้อมูลนี้:

"""
${content}
"""

ข้อกำหนด:
- rewrite ใหม่ทั้งหมด ห้าม copy
- ห้ามแต่งข้อมูลเพิ่ม
- มี <h2> อย่างน้อย 2
- มี bullet list

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

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔥 URL MODE
    if (body.mode === "url") {
      const articleData = await extract(body.url);

      if (!articleData?.content) {
        return NextResponse.json({ error: "extract failed" });
      }

      const ai = await generateAI(promptRewrite(articleData.content));

      return NextResponse.json({
        success: true,
        articles: [
          {
            ...ai,
            hero_image: articleData.image || null,
          },
        ],
        source_url: body.url,
      });
    }

    // 🔥 SAVE
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
              status: "draft",
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

    return NextResponse.json({ error: "invalid request" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}