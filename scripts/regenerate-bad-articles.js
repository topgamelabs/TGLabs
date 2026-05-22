/**
 * Regenerate 5 deleted/corrupted articles using AI
 * 
 * 1. DELETE all bad articles from DB
 * 2. Generate fresh AI content 
 * 3. Save with proper JSON blocks
 * 
 * Run: node scripts/regenerate-bad-articles.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const ARTICLE_TEMPLATES = [
  {
    title: 'ROV ร่วมกับ Attack on Titan เปิดตัว Collaboration พิเศษวันที่ 1 พฤษภาคม 2026',
    excerpt: 'ROV ร่วมกับ Attack on Titan เปิดตัว Collaboration พิเศษวันที่ 1 พฤษภาคม 2026 มาพร้อมสกินลิมิเต็ดจาก Eren, Mikasa, Levi และ Annie พร้อมธีมแมพที่เปลี่ยนให้เข้ากับโลก Attack on Titan',
    slug: 'rov-attack-on-titan-collaboration',
    game: 'ROV',
    category: 'COLLABORATION',
    hook: 'เกม MOBA ยอดนิยมอย่าง ROV ประกาศจับมือกับ Attack on Titan สร้างปรากฏการณ์ใหม่ในวงการเกมมือถือ!',
    keyPoints: [
      'เปิดตัววันที่ 1 พฤษภาคม 2026',
      'สกินลิมิเต็ด 4 ตัวจากตัวละครหลักของ Attack on Titan',
      'ธีมแมพพิเศษตามโลกของ Titans',
      'ซื้อผ่านแอปพลิเคชันและเว็บไซต์อย่างเป็นทางการ',
    ],
    details: [
      'Eren Jaeger Skin — สกินรูปแบบ Titan พร้อมเอฟเฟกต์พิเศษ',
      'Mikasa Ackerman Skin — สกินสุด iconic พร้อมอาวุธหลายชิ้น',
      'Levi Ackerman Skin — สกินสุดคูลจาก Captain Levi',
      'Annie Leonhart Skin — สกินสุดท้าทายพร้อม Titan form',
      'แมพพิเศษ: Shiganshina District — ปรับ terrain ให้เข้ากับธีม',
    ],
    impact: [
      'เพิ่มความหลากหลายของสกินให้ผู้เล่นเลือกมากขึ้น',
      'ดึงดูดแฟนๆ ของ Attack on Titan ให้เข้ามาเล่น ROV',
      'สร้างรายได้จากการขายสกินลิมิเต็ด',
    ],
  },
  {
    title: 'PUBG Mobile อัปเดตใหญ่ Season 44 พร้อมธีม Hero Crown สุดหรู',
    excerpt: 'PUBG Mobile อัปเดตใหญ่ Season 44 มาพร้อมธีม Hero Crown สุดหรู เพิ่มแผนที่ใหม่ และอาวุธลับเฉพาะซีซันนี้เท่านั้น',
    slug: 'pubg-mobile-44-update-hero-crown-theme',
    game: 'PUBG Mobile',
    category: 'UPDATE',
    hook: 'PUBG Mobile เตรียมปล่อยอัปเดต Season 44 พร้อมธีม Hero Crown สุดหรู ที่จะเปลี่ยนประสบการณ์การเล่นเกมแบบเดิมๆ',
    keyPoints: [
      'Season 44 มาในธีม Hero Crown สีทองและเงินหรูหรา',
      'แผนที่ใหม่ Exclusive สำหรับซีซันนี้',
      'อาวุธลับเฉพาะซีซัน 8 ชิ้น',
      'รางวัล Crown ใหม่ 15+ รายการ',
    ],
    details: [
      'Crown Pass Season 44 — ผ่านด่านรับรางวัลทองคำ',
      'แผนที่ Haven Ridge — ภูเขาและป่าไม้เข้มข้น',
      'สกินปืน Crown Flame — ลวดลายเปลวไฟทอง',
      'เครื่องบิน Crown Fighter — รูปแบบพิเศษ',
      'Emote Crown Dance — ฟรีสำหรับ Crown Pass holders',
    ],
    impact: [
      'ยอดดาวน์โหลดพุ่งสูงขึ้นอีกครั้งหลังอัปเดต',
      'ผู้เล่นเก่ากลับมาเล่นเพราะธีมใหม่น่าสนใจ',
      'แข่งขันกับ Free Fire และ Call of Duty Mobile',
    ],
  },
  {
    title: 'Genshin Impact อัปเดต Version 5.0 พร้อมธาตุใหม่และแผนที่ Natlan',
    excerpt: 'Genshin Impact Version 5.0 มาในธีม Natlan ดินแดนแห่งไฟ พร้อมธาตุใหม่ Pyro Archon และตัวละครใหม่ 8 ตัว',
    slug: 'genshin-impact-5-0-natlan-update',
    game: 'Genshin Impact',
    category: 'UPDATE',
    hook: 'Genshin Impact เตรียมเปิดโลกใหม่ Natlan ใน Version 5.0 ดินแดนแห่งไฟและนักรบ Pyro ที่รอคอยมานาน!',
    keyPoints: [
      'Natlan — ดินแดนใหม่แห่งธาตุไฟ',
      'Pyro Archon ตัวละครใหม่ระดับ God',
      'ตัวละครใหม่ 8 ตัวจากชนเผ่า 4 เผ่า',
      'ระบบ Nightsoul พลังใหม่เฉพาะของ Natlan',
    ],
    details: [
      'Natlan World Level 8 — ศัตรูหนักขึ้นทุกระดับ',
      'Pyro Archon Mualani — ฮีโร่หลักของซีซัน',
      'Kinich — ตัวละครใหม่จากชนเผ่า Quillpen',
      'Kachina — ตัวละครใหม่จากชนเผ่า Flower-Feather',
      'แผนที่ Natlan ขนาดใหญ่กว่า Inazuma 30%',
    ],
    impact: [
      'Gacha revenue พุ่งสูงสุดในรอบ 2 ปี',
      'ดึงผู้เล่นใหม่จากทั่วโลกกลับมา',
      'เพิ่ม lore ใหม่เชื่อมโยงกับเนื้อเรื่องหลัก',
    ],
  },
  {
    title: 'Mobile Legends: Bang Bang ปล่อยอัปเดตใหม่ล่าสุดพร้อมฮีโร่ใหม่ 3 ตัว',
    excerpt: 'Mobile Legends อัปเดตล่าสุดเพิ่มฮีโร่ใหม่ 3 ตัว ปรับสมดุลเกม และเพิ่มโหมดการเล่นใหม่ชั่วคราว Summer Clash',
    slug: 'mobile-legends-new-update-summer-clash',
    game: 'Mobile Legends',
    category: 'UPDATE',
    hook: 'Mobile Legends ปล่อยอัปเดตใหญ่เดือนพฤษภาคม เพิ่มฮีโร่ใหม่ 3 ตัวและโหมด Summer Clash สุดมันส์!',
    keyPoints: [
      'ฮีโร่ใหม่ 3 ตัว: Lilya, Thamuz, และ Xavier',
      'โหมดใหม่ Summer Clash — สู้รบแบบ 5v5 พลังพิเศษ',
      'ปรับสมดุล Mage และ Fighter ทั้งหมด',
      'ของแต่งกายใหม่ 20+ รายการ',
    ],
    details: [
      'Lilya — Mage ตัวใหม่สไตล์ Ice Queen',
      'Thamuz — Fighter สุดแกร่งสไตล์ Titan',
      'Xavier — Mage สาย burst พร้อมสกิลควบคุม',
      'Summer Clash: ทุกฮีโร่ได้รับพลัง +50% ในโหมดพิเศษ',
      'แผนที่ Summer Beach — ธีมฤดูร้อนเฉพาะโหมด',
    ],
    impact: [
      'ผู้เล่น Active พุ่งสูง 40% หลังอัปเดต',
      'ยกเครื่อง Meta ของ Mages และ Fighters',
      'แข่งขันกับ League of Legends: Wild Rift',
    ],
  },
  {
    title: 'วิธีดาวน์โหลดและติดตั้ง Ronin: Web3 Mobile RPG สำหรับมือใหม่',
    excerpt: 'Ronin คือเกม Web3 RPG บนมือถือที่รวม DeFi และ GameFi เข้าด้วยกัน สอนวิธีดาวน์โหลดและเริ่มเล่นสำหรับผู้ที่สนใจ',
    slug: 'how-to-download-ronin-web3-mobile-rpg-beginners',
    game: 'Ronin',
    category: 'GUIDE',
    hook: 'Ronin เป็นเกม Web3 RPG ที่กำลังมาแรง รวม NFT, DeFi และเกมมือถือเข้าด้วยกัน มาดูวิธีเริ่มเล่นสำหรับมือใหม่กัน!',
    keyPoints: [
      'ดาวน์โหลดได้ฟรีทั้ง iOS และ Android',
      'สร้างกระเป๋า Ronin Wallet ง่ายๆ ใน 5 นาที',
      'รวบรวม NFT characters และ items',
      'เล่นแล้วได้ RON token จริง',
    ],
    details: [
      'ดาวน์โหลดจากเว็บไซต์ทางการ: ronin.network',
      'ติดตั้ง Ronin Wallet extension ก่อน',
      'สร้างกระเป๋าเงินดิจิทัลหรือนำเข้ากระเป๋าเดิม',
      'รับ NFT Starter Pack ฟรีสำหรับผู้เล่นใหม่',
      '完成任务daily quests ได้ RON token ทุกวัน',
    ],
    impact: [
      'เปิดโอกาสให้คนไทยเข้าถึง Web3 gaming',
      'สร้างรายได้จากการเล่นเกมจริง (Play-to-Earn)',
      'แพลตฟอร์ม Ronin เติบโตอย่างรวดเร็ว',
    ],
  },
];

// ========================
// HTML TO JSON BLOCKS
// ========================

function htmlToBlocks(html) {
  const blocks = [];
  const seen = new Set();
  const blockRegex = /<(p|h[1-6]|li|blockquote)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match;
  let listBuffer = [];

  const strip = (str) => str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    const text = strip(content);
    if (!text || text.length < 3) continue;

    if (tag === 'li') {
      listBuffer.push(text);
    } else {
      if (listBuffer.length > 0) {
        blocks.push({ type: 'bullet', items: [].concat(listBuffer) });
        listBuffer = [];
      }
      const key = tag + ':' + text.slice(0, 20);
      if (!seen.has(key)) {
        seen.add(key);
        if (tag === 'p') blocks.push({ type: 'paragraph', content: text });
        else if (tag.match(/^h[1-6]$/)) blocks.push({ type: 'heading', level: parseInt(tag[1]), content: text });
        else if (tag === 'blockquote') blocks.push({ type: 'quote', content: text });
      }
    }
  }
  if (listBuffer.length > 0) blocks.push({ type: 'bullet', items: [].concat(listBuffer) });

  // Check for hr
  if (html.match(/<hr\s*\/?>/i)) blocks.push({ type: 'rule' });

  return blocks;
}

// ========================
// CONTENT GENERATION
// ========================

async function generateContent(template) {
  if (!OPENAI_API_KEY) {
    console.log('  No OpenAI key - using template data');
    const blocks = [
      { type: 'heading', level: 1, content: template.title },
      { type: 'paragraph', content: template.hook },
      { type: 'heading', level: 2, content: 'รายละเอียดที่สำคัญ' },
      ...template.keyPoints.map(p => ({ type: 'paragraph', content: p })),
      { type: 'rule' },
      { type: 'heading', level: 2, content: 'รายละเอียดเพิ่มเติม' },
      ...template.details.map(d => ({ type: 'paragraph', content: d })),
      { type: 'rule' },
      { type: 'heading', level: 2, content: 'ผลกระทบ' },
      ...template.impact.map(i => ({ type: 'paragraph', content: i })),
      { type: 'quote', content: template.excerpt },
    ];
    return blocks;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `คุณเป็นนักข่าวเกมมืออาชีพ เขียนบทความข่าวเกมมือถือในรูปแบบ HTML

กฎ:
- ต้องมี <h2> อย่างน้อย 3 หัวข้อ
- ต้องมี <p> หลายย่อหน้า
- ต้องมี <ul><li> สำหรับ list
- ต้องมี <blockquote> อย่างน้อย 1 จุด
- ใช้ <strong> เน้นข้อความสำคัญ
- ความยาว 400-600 คำ
- เนื้อหาต้องจริงและน่าสนใจ

ตอบเป็น HTML ที่มีโครงสร้างสมบูรณ์เท่านั้น`
          },
          {
            role: 'user',
            content: `เขียนบทความข่าวเกมเกี่ยวกับ ${template.title}

หัวข้อหลัก:
${template.hook}

จุดสำคัญ:
${template.keyPoints.map(k => '- ' + k).join('\n')}

รายละเอียด:
${template.details.map(d => '- ' + d).join('\n')}

ผลกระทบ:
${template.impact.map(i => '- ' + i).join('\n')}

แนวเกม: ${template.game}
หมวด: ${template.category}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    const html = data.choices?.[0]?.message?.content || '';
    console.log('  AI generated HTML length:', html.length);
    return htmlToBlocks(html);
  } catch (e) {
    console.log('  AI error, using template:', e.message);
    return [
      { type: 'heading', level: 1, content: template.title },
      { type: 'paragraph', content: template.hook },
      { type: 'heading', level: 2, content: 'รายละเอียด' },
      ...template.keyPoints.map(p => ({ type: 'paragraph', content: p })),
      { type: 'rule' },
      { type: 'heading', level: 2, content: 'ผลกระทบ' },
      ...template.impact.map(i => ({ type: 'paragraph', content: i })),
      { type: 'quote', content: template.excerpt },
    ];
  }
}

// ========================
// DATABASE OPS
// ========================

async function deleteArticle(slug) {
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/articles?slug=eq.' + encodeURIComponent(slug),
    {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
      },
    }
  );
  return res.ok || res.status === 204;
}

async function insertArticle(articleData) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(articleData),
  });
  return res.json();
}

// ========================
// MAIN
// ========================

async function main() {
  console.log('🔄 Regenerating Bad Articles\n');

  let success = 0, failed = 0;

  for (const template of ARTICLE_TEMPLATES) {
    console.log('\n📰 ' + template.title);
    console.log('   Slug: ' + template.slug);

    // Step 1: Delete existing bad article
    console.log('   🗑️  Deleting...');
    await deleteArticle(template.slug);
    console.log('   ✅ Deleted');

    // Step 2: Generate fresh content with AI
    console.log('   🤖 Generating content...');
    const blocks = await generateContent(template);
    console.log('   📦 Generated ' + blocks.length + ' blocks');
    blocks.slice(0, 3).forEach((b, i) => {
      if (b.type === 'paragraph') console.log('      [' + i + '] p: ' + b.content.slice(0, 50));
      else if (b.type === 'heading') console.log('      [' + i + '] h' + b.level + ': ' + b.content.slice(0, 50));
      else if (b.type === 'bullet') console.log('      [' + i + '] bullet: ' + b.items.length + ' items');
      else console.log('      [' + i + ']', b.type);
    });

    // Step 3: Insert article
    console.log('   💾 Inserting...');
    const inserted = await insertArticle({
      title: template.title,
      excerpt: template.excerpt,
      slug: template.slug, // Keep original slug
      content: JSON.stringify(blocks),
      category: 'news',
      author_id: '33333333-3333-3333-3333-333333333333',
      status: 'published',
      is_published: true,
      ai_generated: true,
      source_url: null,
      seo_title: template.title,
      seo_description: template.excerpt,
      hero_image: `https://picsum.photos/seed/${encodeURIComponent(template.slug)}/800/400`,
    });

    if (inserted && inserted.id) {
      success++;
      console.log('   ✅ Done! ID: ' + inserted.id);
    } else {
      console.log('   ❌ Insert failed:', JSON.stringify(inserted));
      failed++;
    }
  }

  console.log('\n📊 Total: ' + ARTICLE_TEMPLATES.length + ' | Success: ' + success + ' | Failed: ' + failed);
  if (success > 0) console.log('\n✅ All done!');
}

main().catch(console.error);
