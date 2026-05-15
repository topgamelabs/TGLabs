import { extract } from "@extractus/article-extractor";
import { getPublicSupabaseConfig } from "@/lib/env";

const { url: SUPABASE_REST_URL } = getPublicSupabaseConfig();

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
- มี <h2> อย่างน้อย 2

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

export async function processNewsURL(url: string) {
  const articleData = await extract(url);

  if (!articleData?.content) return;

  const ai = await generateAI(promptRewrite(articleData.content));

  await fetch(
    `${SUPABASE_REST_URL}/rest/v1/articles`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        title: ai.title,
        excerpt: ai.excerpt,
        content: ai.content,
        slug: generateSlug(ai.title),
        category: "news",
        author_id: "33333333-3333-3333-3333-333333333333",
        status: "draft",
        ai_generated: true,
        source_url: url,
        hero_image:
          articleData.image ||
          `https://picsum.photos/seed/${encodeURIComponent(
            ai.title
          )}/800/400`,
      }),
    }
  );
}
