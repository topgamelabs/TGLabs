export interface Character {
  icon: string;
  name: string;
  role: string;
  s: number;
}

export interface Tier {
  label: string;
  style: React.CSSProperties;
  chars: Character[];
}

export type PatchTag = [string, "buff" | "nerf" | "new" | "event" | "fix"];

export interface Patch {
  ver: string;
  date: string;
  title: string;
  desc: string;
  tags: PatchTag[];
}

export interface Tip {
  icon: string;
  lv: string;
  lvk: "beg" | "mid" | "adv";
  title: string;
  desc: string;
}

export interface Game {
  id: string;
  name: string;
  short: string;
  genre: string;
  icon: string;
  patch: string;
  color: string;
  colorDim: string;
  banner: string;
  tags: string[];
  tiers: Tier[];
  patches: Patch[];
  tips: Tip[];
  chars: Character[];
}

export const GAMES: Game[] = [
  {
    id: "tosm",
    name: "Tree of Savior M",
    short: "ToS M",
    genre: "MMORPG",
    icon: "🌿",
    patch: "v2.4.1",
    color: "#4dcc8a",
    colorDim: "rgba(77,204,138,0.12)",
    banner: "linear-gradient(135deg,#030f08,#071a10,#040e0a)",
    tags: ["HOT"],
    tiers: [
      { label: "S", style: { background: "linear-gradient(135deg,#7c2020,#c0392b)", color: "#fff8ee", boxShadow: "0 0 18px rgba(192,57,43,0.4)" }, chars: [{ icon: "🌑", name: "Dark Lord", role: "Wizard", s: 3 }, { icon: "🔥", name: "Pyromancer", role: "Wizard", s: 3 }, { icon: "⚡️", name: "Electromancer", role: "Wizard", s: 3 }, { icon: "🏹", name: "Fletcher", role: "Archer", s: 3 }, { icon: "🌿", name: "Druid", role: "Cleric", s: 3 }] },
      { label: "A", style: { background: "linear-gradient(135deg,#7a4200,#c97b00)", color: "#fff8e1" }, chars: [{ icon: "🛡️", name: "Peltasta", role: "Swordsman", s: 2 }, { icon: "✨", name: "Chronomancer", role: "Wizard", s: 2 }, { icon: "🗡️", name: "Corsair", role: "Scout", s: 2 }, { icon: "❄️", name: "Cryomancer", role: "Wizard", s: 2 }] },
      { label: "B", style: { background: "linear-gradient(135deg,#1a4a1a,#2e7d32)", color: "#e8f5e9" }, chars: [{ icon: "🌊", name: "Psychokino", role: "Wizard", s: 2 }, { icon: "🐺", name: "Ranger", role: "Archer", s: 2 }, { icon: "🌀", name: "Linker", role: "Wizard", s: 1 }] },
      { label: "C", style: { background: "linear-gradient(135deg,#0d2d5c,#1565c0)", color: "#e3f2fd" }, chars: [{ icon: "🔮", name: "Wizard3", role: "Wizard", s: 1 }, { icon: "🎶", name: "Bokor", role: "Cleric", s: 1 }] },
    ],
    patches: [
      { ver: "v2.4.1", date: "22 มี.ค. 2026", title: "Chapter IV: Shadow of Goddess", desc: "เพิ่ม Dungeon ใหม่ Goddess's Sanctuary พร้อม raid mode 8 คน", tags: [["New Dungeon", "new"], ["Buff x7", "buff"], ["Nerf x3", "nerf"]] },
      { ver: "v2.4.0", date: "1 มี.ค. 2026", title: "New Class: Electromancer", desc: "เพิ่ม class ใหม่ Electromancer สายวิซาร์ด พร้อม seasonal event Festival of Lights", tags: [["New Class", "new"], ["Event", "event"]] },
    ],
    tips: [
      { icon: "🧭", lv: "มือใหม่", lvk: "beg", title: "เลือก Class แรกอย่างไร?", desc: "แนะนำ Cleric (ง่ายสุด), Archer (damage สูง), Wizard (ยากแต่สนุก)" },
      { icon: "🗺️", lv: "กลาง", lvk: "mid", title: "Dungeon Routing สำหรับ Solo", desc: "เส้นทาง dungeon ที่ดีที่สุด — ลำดับ room, mob priority, ประหยัด cooldown" },
      { icon: "⚔️", lv: "ขั้นสูง", lvk: "adv", title: "Guild Siege Strategy 20v20", desc: "การวาง position ใน siege, role ของแต่ละ class, timing ultimate" },
      { icon: "💎", lv: "ขั้นสูง", lvk: "adv", title: "Enhance & Transcend Equipment", desc: "คำนวณ cost ก่อน +11, เมื่อไหร่ควร transcend, material ที่ควรเก็บ" },
    ],


chars: [{ icon: "🌑", name: "Dark Lord", role: "Wizard", s: 3 }, { icon: "🔥", name: "Pyromancer", role: "Wizard", s: 3 }, { icon: "⚡️", name: "Electromancer", role: "Wizard", s: 3 }, { icon: "🛡️", name: "Peltasta", role: "Swordsman", s: 2 }, { icon: "🏹", name: "Fletcher", role: "Archer", s: 3 }, { icon: "🌿", name: "Druid", role: "Cleric", s: 3 }, { icon: "❄️", name: "Cryomancer", role: "Wizard", s: 2 }, { icon: "🌙", name: "Sorcerer", role: "Scout", s: 1 }],
  },
  {
    id: "rov",
    name: "ROV",
    short: "ROV",
    genre: "MOBA",
    icon: "⚔️",
    patch: "3.42",
    color: "#f7931e",
    colorDim: "rgba(247,147,30,0.12)",
    banner: "linear-gradient(135deg,#0f0800,#1f0e00,#120900)",
    tags: ["HOT"],
    tiers: [
      { label: "S", style: { background: "linear-gradient(135deg,#7c2020,#c0392b)", color: "#fff8ee", boxShadow: "0 0 18px rgba(192,57,43,0.4)" }, chars: [{ icon: "🐉", name: "Ryoma", role: "Assassin", s: 3 }, { icon: "🌊", name: "Poseidon", role: "Mage", s: 3 }, { icon: "⚡️", name: "Zata", role: "Assassin", s: 3 }, { icon: "🦅", name: "Veres", role: "Fighter", s: 3 }] },
      { label: "A", style: { background: "linear-gradient(135deg,#7a4200,#c97b00)", color: "#fff8e1" }, chars: [{ icon: "🗡️", name: "Murad", role: "Assassin", s: 2 }, { icon: "🌸", name: "Liliana", role: "Mage", s: 2 }, { icon: "🛡️", name: "Taara", role: "Fighter", s: 2 }] },
      { label: "B", style: { background: "linear-gradient(135deg,#1a4a1a,#2e7d32)", color: "#e8f5e9" }, chars: [{ icon: "🏹", name: "Violet", role: "Marksman", s: 2 }, { icon: "🌿", name: "Chaugnar", role: "Support", s: 1 }] },
    ],
    patches: [
      { ver: "3.42", date: "20 มี.ค. 2026", title: "Balance Update + New Hero Ryoma", desc: "ปรับสมดุลฮีโร่หลายตัว พร้อมเพิ่มฮีโร่ใหม่ Ryoma นักดาบจากตะวันออก", tags: [["New Hero", "new"], ["Buff", "buff"], ["Nerf", "nerf"]] },
      { ver: "3.41", date: "1 มี.ค. 2026", title: "Jungle & Item Rework", desc: "ปรับระบบ Jungle ใหม่ทั้งหมด เพิ่ม objective ใหม่กลางแผนที่", tags: [["Rework", "fix"], ["New Item", "new"]] },
    ],
    tips: [
      { icon: "🗺️", lv: "มือใหม่", lvk: "beg", title: "Map Awareness & Minimap", desc: "เทคนิคการมองมินิแม็ปตลอดเวลา วิธีเช็คว่าศัตรูอยู่ที่ไหน" },
      { icon: "⏱️", lv: "กลาง", lvk: "mid", title: "Jungle Timer & Objective Control", desc: "Track เวลา respawn Dragon และ Dark Slayer พร้อม vision control" },
      { icon: "🎯", lv: "ขั้นสูง", lvk: "adv", title: "Wave Management & CS", desc: "Freeze lane, slow push, fast push และวิธี deny CS ศัตรู" },
    ],
    chars: [{ icon: "🐉", name: "Ryoma", role: "Assassin", s: 3 }, { icon: "🌊", name: "Poseidon", role: "Mage", s: 3 }, { icon: "⚡️", name: "Zata", role: "Assassin", s: 3 }, { icon: "🛡️", name: "Taara", role: "Fighter", s: 2 }, { icon: "🏹", name: "Violet", role: "Marksman", s: 2 }, { icon: "🌿", name: "Chaugnar", role: "Support", s: 1 }],
  },
  {
    id: "mlbb",
    name: "Mobile Legends",
    short: "MLBB",
    genre: "MOBA",
    icon: "🔥",
    patch: "1.8.92",
    color: "#ff5c7a",
    colorDim: "rgba(255,92,122,0.12)",
    banner: "linear-gradient(135deg,#0f0000,#1f0000,#120000)",
    tags: ["HOT"],
    tiers: [
      { label: "S", style: { background: "linear-gradient(135deg,#7c2020,#c0392b)", color: "#fff8ee", boxShadow: "0 0 18px rgba(192,57,43,0.4)" }, chars: [{ icon: "🌪️", name: "Ling", role: "Assassin", s: 3 }, { icon: "💜", name: "Kagura", role: "Mage", s: 3 }, { icon: "🌀", name: "Gusion", role: "Assassin", s: 3 }, { icon: "❄️", name: "Lancelot", role: "Assassin", s: 3 }] },
      { label: "A", style: { background: "linear-gradient(135deg,#7a4200,#c97b00)", color: "#fff8e1" }, chars: [{ icon: "🌺", name: "Odette", role: "Mage", s: 2 }, { icon: "🐺", name: "Harley", role: "Mage", s: 2 }, { icon: "🌊", name: "Nana", role: "Mage", s: 2 }] },

{ label: "B", style: { background: "linear-gradient(135deg,#1a4a1a,#2e7d32)", color: "#e8f5e9" }, chars: [{ icon: "🗝️", name: "Franco", role: "Tank", s: 1 }, { icon: "🌱", name: "Estes", role: "Support", s: 1 }] },
    ],
    patches: [
      { ver: "1.8.92", date: "18 มี.ค. 2026", title: "Project NEXT Phase 5", desc: "รีเวิร์ก visual และ skill ของฮีโร่รุ่นเก่า 3 ตัว พร้อมปรับ ranked system", tags: [["Revamp", "fix"], ["Buff x5", "buff"], ["Nerf x3", "nerf"]] },
    ],
    tips: [
      { icon: "⚡️", lv: "กลาง", lvk: "mid", title: "Early Game Rotation (Jungler)", desc: "แนวทางการ clear jungle + gank lane ใน 3 นาทีแรก สร้าง early lead" },
      { icon: "🎮", lv: "มือใหม่", lvk: "beg", title: "เลือก Role ที่เหมาะกับตัวเอง", desc: "ข้อดีข้อเสียของแต่ละ role และฮีโร่แนะนำสำหรับมือใหม่" },
      { icon: "🔥", lv: "ขั้นสูง", lvk: "adv", title: "Combo Assassin ระดับ Pro", desc: "เทคนิค combo สายบู๊ระดับสูง blink skill + ultimate ให้แม่นยำ" },
    ],
    chars: [{ icon: "🌪️", name: "Ling", role: "Assassin", s: 3 }, { icon: "💜", name: "Kagura", role: "Mage", s: 3 }, { icon: "🌀", name: "Gusion", role: "Assassin", s: 3 }, { icon: "🦁", name: "Lesley", role: "Marksman", s: 2 }, { icon: "🌺", name: "Odette", role: "Mage", s: 2 }, { icon: "🌱", name: "Estes", role: "Support", s: 1 }],
  },
  {
    id: "pubg",
    name: "PUBG Mobile",
    short: "PUBG",
    genre: "Battle Royale",
    icon: "🎯",
    patch: "S29",
    color: "#c9a84c",
    colorDim: "rgba(201,168,76,0.12)",
    banner: "linear-gradient(135deg,#0a0900,#181400,#0d0b00)",
    tags: [],
    tiers: [
      { label: "S", style: { background: "linear-gradient(135deg,#7c2020,#c0392b)", color: "#fff8ee", boxShadow: "0 0 18px rgba(192,57,43,0.4)" }, chars: [{ icon: "🔫", name: "M416", role: "AR", s: 3 }, { icon: "💥", name: "AWM", role: "Sniper", s: 3 }, { icon: "🎯", name: "Groza", role: "AR", s: 3 }] },
      { label: "A", style: { background: "linear-gradient(135deg,#7a4200,#c97b00)", color: "#fff8e1" }, chars: [{ icon: "🔧", name: "AKM", role: "AR", s: 2 }, { icon: "⚡️", name: "SCAR-L", role: "AR", s: 2 }, { icon: "🌪️", name: "UZI", role: "SMG", s: 2 }] },
      { label: "B", style: { background: "linear-gradient(135deg,#1a4a1a,#2e7d32)", color: "#e8f5e9" }, chars: [{ icon: "🏹", name: "Crossbow", role: "Special", s: 1 }, { icon: "🔩", name: "DP-28", role: "LMG", s: 1 }] },
    ],
    patches: [
      { ver: "S29", date: "15 มี.ค. 2026", title: "New Map: Nusa Island + Vehicle Update", desc: "เพิ่มแผนที่ใหม่ Nusa Island ขนาดกลาง พร้อมยานพาหนะใหม่และปรับ gunplay", tags: [["New Map", "new"], ["Balance", "fix"]] },
    ],
    tips: [
      { icon: "🪂", lv: "มือใหม่", lvk: "beg", title: "การเลือกจุด Drop", desc: "วิธีเลือก landing zone เพื่อ loot ดีเร็ว หลีกเลี่ยงศัตรูมากเกินไปช่วงต้น" },
      { icon: "🔭", lv: "กลาง", lvk: "mid", title: "การยิงระยะไกล & Ballistic", desc: "คำนวณ bullet drop, เลือก scope และเทคนิค lead shot สำหรับเป้าเคลื่อนที่" },
      { icon: "🔵", lv: "ขั้นสูง", lvk: "adv", title: "Zone Management & Positioning", desc: "อ่าน zone ล่วงหน้า, เลือก positioning และ rotate ปลอดภัยใน endgame" },
    ],
    chars: [{ icon: "🔫", name: "M416", role: "AR", s: 3 }, { icon: "💥", name: "AWM", role: "Sniper", s: 3 }, { icon: "🔧", name: "AKM", role: "AR", s: 2 }, { icon: "🌪️", name: "UZI", role: "SMG", s: 2 }, { icon: "🎯", name: "Groza", role: "AR", s: 3 }, { icon: "🏹", name: "Crossbow", role: "Special", s: 1 }],
  },
  {
    id: "ff",
    name: "Free Fire",
    short: "FF",
    genre: "Battle Royale",
    icon: "💎",
    patch: "OB45",
    color: "#5ab4ff",
    colorDim: "rgba(90,180,255,0.12)",
    banner: "linear-gradient(135deg,#00060f,#000d1a,#00070f)",
    tags: ["NEW"],
    tiers: [

{ label: "S", style: { background: "linear-gradient(135deg,#7c2020,#c0392b)", color: "#fff8ee", boxShadow: "0 0 18px rgba(192,57,43,0.4)" }, chars: [{ icon: "🔮", name: "Chrono", role: "Defense", s: 3 }, { icon: "⚡️", name: "Alok", role: "Support", s: 3 }, { icon: "🌊", name: "Xayne", role: "Aggressive", s: 3 }] },
      { label: "A", style: { background: "linear-gradient(135deg,#7a4200,#c97b00)", color: "#fff8e1" }, chars: [{ icon: "🦊", name: "Moco", role: "Recon", s: 2 }, { icon: "🌸", name: "Skyler", role: "Support", s: 2 }, { icon: "💫", name: "Wukong", role: "Fighter", s: 2 }] },
    ],
    patches: [
      { ver: "OB45", date: "12 มี.ค. 2026", title: "New Character + Ranked Reset", desc: "เพิ่มตัวละครใหม่พร้อม passive skill สุดเด็ด และ reset rank ใน Season ใหม่", tags: [["New Char", "new"], ["Season Reset", "event"]] },
    ],
    tips: [
      { icon: "🏃", lv: "มือใหม่", lvk: "beg", title: "Gloo Wall Usage", desc: "เทคนิคการวาง Gloo Wall ในสถานการณ์ต่างๆ เพื่อปกป้องและ revive เพื่อน" },
      { icon: "👥", lv: "กลาง", lvk: "mid", title: "Character Combo สำหรับ Squad", desc: "การจับคู่ skill ตัวละครให้ synergy กัน เพิ่มโอกาสชนะในโหมด Squad" },
    ],
    chars: [{ icon: "🔮", name: "Chrono", role: "Defense", s: 3 }, { icon: "⚡️", name: "Alok", role: "Support", s: 3 }, { icon: "🌊", name: "Xayne", role: "Aggressive", s: 3 }, { icon: "🦊", name: "Moco", role: "Recon", s: 2 }],
  },
];
