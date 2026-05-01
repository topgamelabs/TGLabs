import { NextRequest, NextResponse } from "next/server";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\wก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  return new Response("API READY");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body.input;

    if (!input) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const prompt = `
คุณคือนักเขียนข่าวเกมมือถือในไทย

เขียนข่าวจากข้อมูลนี้:
${input}

ข้อกำหนด:
- ภาษาไทย อ่านง่าย
- ไม่ clickbait
- มีหัวข้อย่อย
- ปิดท้ายด้วย bullet 3 ข้อ

ตอบเป็น JSON เท่านั้น:
{
  "title": "string",
  "excerpt": "string",
  "content": "<p>...</p>"
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
      }),
    });

    const aiData = await aiRes.json();

    let text = "";

    if (aiData.output_text) {
      text = aiData.output_text;
    } else if (aiData.output?.[0]?.content?.[0]?.text) {
      text = aiData.output[0].content[0].text;
    }

    if (!text) {
      console.error("[AI Generate] NO OUTPUT from AI API. Raw:", JSON.stringify(aiData));
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("[AI Generate] JSON PARSE ERROR:", cleaned);
      return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
    }

    const slug = generateSlug(parsed.title);

    const saveRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/articles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          title: parsed.title,
          excerpt: parsed.excerpt,
          content: parsed.content,
          slug: slug,
          category: "news", // ✅ เพิ่มตรงนี้ (สำคัญมาก)
          status: "draft",
          ai_generated: true,
        }),
      }
    );

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("[AI Generate] SUPABASE INSERT ERROR:", errText);
      return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
    }

    const saved = await saveRes.json();

    return NextResponse.json({
      success: true,
      article: saved[0],
    });

  } catch (error) {
    console.error("[AI Generate] SERVER ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}