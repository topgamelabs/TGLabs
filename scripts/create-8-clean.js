/**
 * Quick clean article creator
 */

const SUPABASE_URL = 'https://pegajhvjrldsdzfyppcv.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDU2NSwiZXhwIjoyMDkwODAwNTY1fQ.vwYsQF5V9TnOU9bRTpkJjXZ9CXX-tQE8V8yLqpzlmMQ';

const BLOCKS = {
  'rov-attack-on-titan-collaboration': [
    {type:'heading',level:1,content:'ROV ร่วมกับ Attack on Titan เปิดตัว Collaboration พิเศษวันที่ 1 พฤษภาคม 2026'},
    {type:'paragraph',content:'เกม MOBA ยอดนิยมอย่าง ROV ประกาศจับมือกับ Attack on Titan สร้างปรากฏการณ์ใหม่ในวงการเกมมือถือ!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'เปิดตัววันที่ 1 พฤษภาคม 2026 มาพร้อมสกินลิมิเต็ด 4 ตัวจากตัวละครหลักของ Attack on Titan ได้แก่ Eren, Mikasa, Levi และ Annie'},
    {type:'paragraph',content:'ธีมแมพพิเศษตามโลกของ Titans ทำให้ผู้เล่นรู้สึกเหมือนได้เข้าไปอยู่ในเรื่องราวของ Attack on Titan จริงๆ'},
    {type:'paragraph',content:'สามารถซื้อสกินได้ผ่านแอปพลิเคชันและเว็บไซต์อย่างเป็นทางการ'},
    {type:'rule'},
    {type:'heading',level:2,content:'รายละเอียดสกิน'},
    {type:'bullet',items:['Eren Jaeger Skin — สกินรูปแบบ Titan พร้อมเอฟเฟกต์พิเศษ','Mikasa Ackerman Skin — สกินสุด iconic พร้อมอาวุธหลายชิ้น','Levi Ackerman Skin — สกินสุดคูลจาก Captain Levi','Annie Leonhart Skin — สกินสุดท้าทายพร้อม Titan form']},
    {type:'paragraph',content:'แมพพิเศษ: Shiganshina District — ปรับ terrain ให้เข้ากับธีม Attack on Titan'},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'เพิ่มความหลากหลายของสกินให้ผู้เล่นเลือกมากขึ้น สร้างรายได้จากการขายสกินลิมิเต็ด'},
    {type:'paragraph',content:'ดึงดูดแฟนๆ ของ Attack on Titan ให้เข้ามาเล่น ROV เป็นครั้งแรก ทำให้ฐานผู้เล่นเพิ่มขึ้นอย่างมีนัยยะ'},
    {type:'quote',content:'ROV ร่วมกับ Attack on Titan เปิดตัว Collaboration พิเศษวันที่ 1 พฤษภาคม 2026 มาพร้อมสกินลิมิเต็ดจาก Eren, Mikasa, Levi และ Annie พร้อมธีมแมพที่เปลี่ยนให้เข้ากับโลก Attack on Titan'},
  ],
  'pubg-mobile-44-update-hero-crown-theme': [
    {type:'heading',level:1,content:'PUBG Mobile อัปเดตใหญ่ Season 44 พร้อมธีม Hero Crown สุดหรู'},
    {type:'paragraph',content:'PUBG Mobile เตรียมปล่อยอัปเดต Season 44 พร้อมธีม Hero Crown สุดหรู ที่จะเปลี่ยนประสบการณ์การเล่นเกมแบบเดิมๆ ให้น่าตื่นตาตื่นใจยิ่งขึ้น!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'Season 44 มาในธีม Hero Crown สีทองและเงินหรูหรา ตัวละครและอาวุธทุกชิ้นจะมาพร้อมการตกแต่งพิเศษ'},
    {type:'paragraph',content:'แผนที่ใหม่ Haven Ridge สำหรับซีซันนี้เท่านั้น ภูเขาและป่าไม้เข้มข้นเหมาะสำหรับการซุ่มโจมตี'},
    {type:'paragraph',content:'อาวุธลับเฉพาะซีซัน 8 ชิ้น รางวัล Crown ใหม่ 15+ รายการ'},
    {type:'rule'},
    {type:'heading',level:2,content:'รายละเอียด Crown Pass'},
    {type:'bullet',items:['Crown Pass Season 44 — ผ่านด่านรับรางวัลทองคำ','สกินปืน Crown Flame — ลวดลายเปลวไฟทอง','เครื่องบิน Crown Fighter — รูปแบบพิเศษ','Emote Crown Dance — ฟรีสำหรับ Crown Pass holders']},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'ยอดดาวน์โหลดพุ่งสูงขึ้นอีกครั้งหลังอัปเดต ผู้เล่นเก่ากลับมาเล่นเพราะธีมใหม่น่าสนใจ'},
    {type:'quote',content:'PUBG Mobile อัปเดตใหญ่ Season 44 มาพร้อมธีม Hero Crown สุดหรู เพิ่มแผนที่ใหม่ และอาวุธลับเฉพาะซีซันนี้เท่านั้น'},
  ],
  'genshin-impact-5-0-natlan-update': [
    {type:'heading',level:1,content:'Genshin Impact อัปเดต Version 5.0 พร้อมธาตุใหม่และแผนที่ Natlan'},
    {type:'paragraph',content:'Genshin Impact เตรียมเปิดโลกใหม่ Natlan ใน Version 5.0 ดินแดนแห่งไฟและนักรบ Pyro ที่แฟนๆ รอคอยมานาน!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'Natlan — ดินแดนใหม่แห่งธาตุไฟ ภูมิประเทศที่หลากหลายตั้งแต่ทุ่งลาวาไปจนถึงป่าดึกดำบรรพ์'},
    {type:'paragraph',content:'Pyro Archon ตัวละครใหม่ระดับ God ที่จะเปลี่ยน meta ของเกมทั้งหมด'},
    {type:'paragraph',content:'ตัวละครใหม่ 8 ตัวจากชนเผ่า 4 เผ่า ระบบ Nightsoul พลังใหม่เฉพาะของ Natlan'},
    {type:'rule'},
    {type:'heading',level:2,content:'ตัวละครใหม่'},
    {type:'bullet',items:['Pyro Archon Mualani — ฮีโร่หลักของซีซัน','Kinich — ตัวละครใหม่จากชนเผ่า Quillpen','Kachina — ตัวละครใหม่จากชนเผ่า Flower-Feather']},
    {type:'paragraph',content:'แผนที่ Natlan ขนาดใหญ่กว่า Inazuma ถึง 30% Natlan World Level 8 ศัตรูหนักขึ้นทุกระดับ'},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'Gacha revenue พุ่งสูงสุดในรอบ 2 ปี ดึงผู้เล่นใหม่จากทั่วโลกกลับมา เพิ่ม lore ใหม่เชื่อมโยงกับเนื้อเรื่องหลัก'},
    {type:'quote',content:'Genshin Impact Version 5.0 มาในธีม Natlan ดินแดนแห่งไฟ พร้อมธาตุใหม่ Pyro Archon และตัวละครใหม่ 8 ตัว'},
  ],
  'mobile-legends-new-update-summer-clash': [
    {type:'heading',level:1,content:'Mobile Legends ปล่อยอัปเดตใหม่ล่าสุดพร้อมฮีโร่ใหม่ 3 ตัวและโหมด Summer Clash'},
    {type:'paragraph',content:'Mobile Legends ปล่อยอัปเดตใหญ่เดือนพฤษภาคม เพิ่มฮีโร่ใหม่ 3 ตัวและโหมด Summer Clash สุดมันส์ที่จะเปลี่ยนประสบการณ์การเล่นเกม!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'ฮีโร่ใหม่ 3 ตัว: Lilya, Thamuz, และ Xavier มาพร้อมความสามารถที่หลากหลายและน่าตื่นตาตื่นใจ'},
    {type:'paragraph',content:'โหมดใหม่ Summer Clash — สู้รบแบบ 5v5 พลังพิเศษ ทุกฮีโร่ได้รับพลัง +50% ในโหมดพิเศษ'},
    {type:'paragraph',content:'ปรับสมดุล Mage และ Fighter ทั้งหมด ของแต่งกายใหม่ 20+ รายการ'},
    {type:'rule'},
    {type:'heading',level:2,content:'ฮีโร่ใหม่'},
    {type:'bullet',items:['Lilya — Mage ตัวใหม่สไตล์ Ice Queen พร้อมสกิลควบคุม','Thamuz — Fighter สุดแกร่งสไตล์ Titan ดาเมจสูง','Xavier — Mage สาย burst พร้อมสกิลควบคุมศัตรู']},
    {type:'paragraph',content:'แผนที่ Summer Beach — ธีมฤดูร้อนเฉพาะโหมด Summer Clash ที่จะทำให้คุณรู้สึกเหมือนอยู่ในชายหาดจริงๆ'},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'ผู้เล่น Active พุ่งสูง 40% หลังอัปเดต ยกเครื่อง Meta ของ Mages และ Fighters'},
    {type:'quote',content:'Mobile Legends อัปเดตล่าสุดเพิ่มฮีโร่ใหม่ 3 ตัว ปรับสมดุลเกม และเพิ่มโหมดการเล่นใหม่ชั่วคราว Summer Clash สุดมันส์!'},
  ],
  'how-to-download-ronin-web3-mobile-rpg-beginners': [
    {type:'heading',level:1,content:'วิธีดาวน์โหลดและติดตั้ง Ronin: Web3 Mobile RPG สำหรับมือใหม่'},
    {type:'paragraph',content:'Ronin เป็นเกม Web3 RPG ที่กำลังมาแรง รวม NFT, DeFi และเกมมือถือเข้าด้วยกัน มาดูวิธีเริ่มเล่นสำหรับมือใหม่กัน!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'ดาวน์โหลดได้ฟรีทั้ง iOS และ Android รองรับทุกอุปกรณ์'},
    {type:'paragraph',content:'สร้างกระเป๋า Ronin Wallet ง่ายๆ ใน 5 นาที รวบรวม NFT characters และ items'},
    {type:'paragraph',content:'เล่นแล้วได้ RON token จริง สร้างรายได้จากการเล่นเกม (Play-to-Earn)'},
    {type:'rule'},
    {type:'heading',level:2,content:'ขั้นตอนการเริ่มเล่น'},
    {type:'bullet',items:['ดาวน์โหลดจากเว็บไซต์ทางการ: ronin.network','ติดตั้ง Ronin Wallet extension ก่อนเพื่อความปลอดภัย','สร้างกระเป๋าเงินดิจิทัลหรือนำเข้ากระเป๋าเดิม','รับ NFT Starter Pack ฟรีสำหรับผู้เล่นใหม่','ทำ daily quests ได้ RON token ทุกวัน']},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'เปิดโอกาสให้คนไทยเข้าถึง Web3 gaming สร้างรายได้จากการเล่นเกมจริง (Play-to-Earn)'},
    {type:'quote',content:'Ronin คือเกม Web3 RPG บนมือถือที่รวม DeFi และ GameFi เข้าด้วยกัน สอนวิธีดาวน์โหลดและเริ่มเล่นสำหรับผู้ที่สนใจ'},
  ],
  'free-fire-max-new-update-may-2026': [
    {type:'heading',level:1,content:'Free Fire Max อัปเดตใหม่ล่าสุดเพิ่มบอสสุดโหดและอาวุธใหม่มากมาย'},
    {type:'paragraph',content:'Free Fire Max ปล่อยอัปเดตใหม่เดือนพฤษภาคม 2026 เพิ่มบอสใหม่ 3 ตัว อาวุธใหม่ 5 ชิ้น และโหมดการเล่นที่หลากหลายมากขึ้น!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'บอสใหม่ 3 ตัว: Inferno Dragon, Frost Titan และ Shadow Phantom มาพร้อมพลังพิเศษที่ท้าทายความสามารถของผู้เล่น'},
    {type:'paragraph',content:'อาวุธใหม่ 5 ชิ้นรวมถึงปืนไรเฟิลจู่โจมระยะไกลและปืนลูกซองพลังสูง'},
    {type:'paragraph',content:'โหมดใหม่ ClaW Wars — สู้รบแบบทีม vs ทีมบนแผนที่พิเศษ'},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'ยอดผู้เล่นพุ่งสูงขึ้น 35% หลังอัปเดต แข่งขันกับ PUBG Mobile และ Call of Duty Mobile'},
    {type:'quote',content:'Free Fire Max ปล่อยอัปเดตใหม่เดือนพฤษภาคม 2026 เพิ่มบอสใหม่ 3 ตัว อาวุธใหม่ 5 ชิ้น และโหมดการเล่นใหม่'},
  ],
  'call-of-duty-mobile-warzone-season': [
    {type:'heading',level:1,content:'Call of Duty Mobile ซีซันใหม่เพิ่มแผนที่ Warzone และโหมด Battle Royale'},
    {type:'paragraph',content:'Call of Duty Mobile ปล่อยซีซันใหม่มาในธีม Warzone สุดมันส์ เพิ่มแผนที่ Warzone ทั้งหมด และโหมด Battle Royale ที่ได้รับการปรับปรุงใหม่!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'แผนที่ Warzone มาในโหมด Battle Royale รวม Verdansk, Rebirth และ Alcatraz'},
    {type:'paragraph',content:'โหมด Plunder ปรับปรุงใหม่พร้อมรางวัลมากขึ้น สกินใหม่ 25+ รายการ'},
    {type:'paragraph',content:'อาวุธใหม่: ISO Hemlock, Marco-A1 และ RPK Brat'},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'ดึงผู้เล่น PC Warzone ให้มาเล่นบนมือถือ เพิ่มรายได้จาก Battle Pass'},
    {type:'quote',content:'Call of Duty Mobile ปล่อยซีซันใหม่มาในธีม Warzone สุดมันส์ เพิ่มแผนที่ Warzone ทั้งหมด และโหมด Battle Royale ที่ได้รับการปรับปรุงใหม่'},
  ],
  'clash-of-clans-town-hall-16-update': [
    {type:'heading',level:1,content:'Clash of Clans อัปเดตใหญ่เพิ่ม Town Hall 16 และสกินใหม่มากมาย'},
    {type:'paragraph',content:'Clash of Clans อัปเดตใหญ่ประกาศ Town Hall 16 พร้อม Troops ใหม่ สกินอัปเกรดสุดพิเศษ และการปรับ balance ครั้งใหญ่!'},
    {type:'heading',level:2,content:'รายละเอียดที่สำคัญ'},
    {type:'paragraph',content:'Town Hall 16 มาพร้อมความสามารถใหม่ทั้งหมด ระดับ Defense สูงสุดและโหมด Army ใหม่'},
    {type:'paragraph',content:'Troops ใหม่: Golem Guard, Electro Wizard Mk2 และ Ice Hound'},
    {type:'paragraph',content:'สกินใหม่ 30+ รายการ รวมถึง TH16 Exclusive Skin ที่หายากมาก'},
    {type:'rule'},
    {type:'heading',level:2,content:'ผลกระทบ'},
    {type:'paragraph',content:'ยอดดาวน์โหลดเพิ่มสูงขึ้นทั่วโลก ผู้เล่นเดิมกลับมาเล่นเพราะอยากลอง Town Hall 16'},
    {type:'quote',content:'Clash of Clans อัปเดตใหญ่ประกาศ Town Hall 16 พร้อม Troops ใหม่ สกินอัปเกรดสุดพิเศษ และการปรับ balance ครั้งใหญ่'},
  ],
};

const TEMPLATES = {
  'rov-attack-on-titan-collaboration': {title:'ROV ร่วมกับ Attack on Titan เปิดตัว Collaboration พิเศษวันที่ 1 พฤษภาคม 2026',excerpt:'ROV ร่วมกับ Attack on Titan เปิดตัว Collaboration พิเศษวันที่ 1 พฤษภาคม 2026 มาพร้อมสกินลิมิเต็ดจาก Eren, Mikasa, Levi และ Annie พร้อมธีมแมพที่เปลี่ยนให้เข้ากับโลก Attack on Titan',seed:'rov-attack-on-titan'},
  'pubg-mobile-44-update-hero-crown-theme': {title:'PUBG Mobile อัปเดตใหญ่ Season 44 พร้อมธีม Hero Crown สุดหรู',excerpt:'PUBG Mobile อัปเดตใหญ่ Season 44 มาพร้อมธีม Hero Crown สุดหรู เพิ่มแผนที่ใหม่ และอาวุธลับเฉพาะซีซันนี้เท่านั้น',seed:'pubg-mobile-44'},
  'genshin-impact-5-0-natlan-update': {title:'Genshin Impact อัปเดต Version 5.0 พร้อมธาตุใหม่และแผนที่ Natlan',excerpt:'Genshin Impact Version 5.0 มาในธีม Natlan ดินแดนแห่งไฟ พร้อมธาตุใหม่ Pyro Archon และตัวละครใหม่ 8 ตัว',seed:'genshin-impact-5'},
  'mobile-legends-new-update-summer-clash': {title:'Mobile Legends ปล่อยอัปเดตใหม่ล่าสุดพร้อมฮีโร่ใหม่ 3 ตัวและโหมด Summer Clash',excerpt:'Mobile Legends อัปเดตล่าสุดเพิ่มฮีโร่ใหม่ 3 ตัว ปรับสมดุลเกม และเพิ่มโหมดการเล่นใหม่ชั่วคราว Summer Clash สุดมันส์!',seed:'mobile-legends-summer'},
  'how-to-download-ronin-web3-mobile-rpg-beginners': {title:'วิธีดาวน์โหลดและติดตั้ง Ronin: Web3 Mobile RPG สำหรับมือใหม่',excerpt:'Ronin คือเกม Web3 RPG บนมือถือที่รวม DeFi และ GameFi เข้าด้วยกัน สอนวิธีดาวน์โหลดและเริ่มเล่นสำหรับผู้ที่สนใจ',seed:'ronin-web3-rpg'},
  'free-fire-max-new-update-may-2026': {title:'Free Fire Max อัปเดตใหม่ล่าสุดเพิ่มบอสสุดโหดและอาวุธใหม่มากมาย',excerpt:'Free Fire Max ปล่อยอัปเดตใหม่เดือนพฤษภาคม 2026 เพิ่มบอสใหม่ 3 ตัว อาวุธใหม่ 5 ชิ้น และโหมดการเล่นใหม่',seed:'free-fire-max'},
  'call-of-duty-mobile-warzone-season': {title:'Call of Duty Mobile ซีซันใหม่เพิ่มแผนที่ Warzone และโหมด Battle Royale',excerpt:'Call of Duty Mobile ปล่อยซีซันใหม่มาในธีม Warzone สุดมันส์ เพิ่มแผนที่ Warzone ทั้งหมด และโหมด Battle Royale ที่ได้รับการปรับปรุงใหม่',seed:'cod-mobile-warzone'},
  'clash-of-clans-town-hall-16-update': {title:'Clash of Clans อัปเดตใหญ่เพิ่ม Town Hall 16 และสกินใหม่มากมาย',excerpt:'Clash of Clans อัปเดตใหญ่ประกาศ Town Hall 16 พร้อม Troops ใหม่ สกินอัปเกรดสุดพิเศษ และการปรับ balance ครั้งใหญ่',seed:'clash-of-clans-th16'},
};

async function insertArticle(data) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function main() {
  console.log('Creating clean articles...\n');
  let success = 0, failed = 0;
  
  const slugs = Object.keys(BLOCKS);
  for (const slug of slugs) {
    const blocks = BLOCKS[slug];
    const t = TEMPLATES[slug];
    
    const result = await insertArticle({
      title: t.title,
      excerpt: t.excerpt,
      slug: slug,
      content: JSON.stringify(blocks),
      category: 'news',
      author_id: '33333333-3333-3333-3333-333333333333',
      status: 'published',
      is_published: true,
      ai_generated: true,
      source_url: null,
      seo_title: t.title,
      seo_description: t.excerpt,
      hero_image: 'https://picsum.photos/seed/' + t.seed + '/800/400',
    });
    
    if (result && result.id) {
      success++;
      console.log('OK:', slug.slice(0,40), '-', blocks.length, 'blocks');
    } else {
      failed++;
      console.log('FAIL:', slug.slice(0,40), JSON.stringify(result).slice(0,60));
    }
  }
  
  console.log('\nTotal:', slugs.length, '| Success:', success, '| Failed:', failed);
}

main().catch(e => console.error(e));
