# TGLabs Content Guidelines

## Brand DNA

- **ชื่อเว็บ:** TopGame Thailand / TGLabs
- **โทน:** ตรงไปตรงมา เป็นกันเอง ไม่หวาน ไม่ clickbait
- **ภาษา:** ไทย (แต่ title ใน meta อาจเป็น EN ก็ได้)
- **ห้ามใช้ emoji ในเนื้อหาข่าว** — ยกเว้น thumbnail/caption

---

## โครงสร้างข่าว (JSON Blocks Format)

Content เป็น JSON array ของ blocks ห้ามใช้ HTML string

```
[{"type":"paragraph",...}]
```

### Block Types

| type | ใช้สำหรับ | ตัวอย่าง |
|------|-----------|---------|
| `paragraph` | ย่อหน้าธรรมดา | `{type:"paragraph",content:"ข้อความ"}` |
| `heading` | หัวข้อย่อย (H2/H3) | `{type:"heading",level:2,content:"หัวข้อ"}` |
| `bullet` | bullet list | `{type:"bullet",items:["ข้อ 1","ข้อ 2"]}` |
| `quote` | คำพูด/เนื้อหาเน้น | `{type:"quote",content:"..."}` |
| `rule` | เส้นแบ่งกลางหน้า | `{type:"rule",label:"สรุป"}` |
| `image` | รูปในเนื้อหา | `{type:"image",imageUrl:"...",imageCaption:"..."}` |
| `ptag` | label สี | `{type:"ptag",tagType:"buff",tagLabel:"BUFF"}` |

---

### 1. Title
- มีชื่อเกมขึ้นต้นหรืออยู่ใน title ชัดเจน
- ตัวอย่าง: `"Genshin Impact เวอร์ชัน 5.0 มาพร้อมพื้นที่ใหม่ Natlan"`
- ห้าม: `"สุดมันส์! Genshin ปล่อยอัปเดตเวอร์เมเปิ้ลสุดเจ๋ง!"`

### 2. Excerpt (บทคัดย่อ)
- **80-150 ตัวอักษร**
- สรุปใจความสำคัญให้น่าคลิกแต่ไม่เกินจริง
- ตอบคำถาม: อะไร / เกมอะไร / ผลกระทบอะไร

### 3. Content Structure (ตัวอย่าง)

```json
[
  { "type": "paragraph", "content": "ROV อัปเดต 3.42 มาพร้อมฮีโร่ใหม่ Ryoma นักดาบจากตะวันออก พร้อมปรับสมดุลฮีโร่หลายตัว" },
  { "type": "heading", "level": 2, "content": "ฮีโร่ใหม่ Ryoma" },
  { "type": "paragraph", "content": "Ryoma เป็นฮีโร่ระยะไกลที่มีความสามารถในการ thrust ทำลายล้าง" },
  { "type": "bullet", "items": ["Flash Slash — พุ่งผ่านศัตรู 3 ตัว", "Shadow Dance — กระโดดหนีเมื่อ HP ต่ำ", "Katana Storm — Ultimate ระดับ AOE"] },
  { "type": "rule", "label": "สรุป" },
  { "type": "paragraph", "content": "ฮีโร่ใหม่นี้เหมาะสำหรับผู้เล่นที่ชอบ aggressive playstyle" }
]
```

### 4. PTag — Colored Labels

ใช้สำหรับ label สีที่ต้องการเน้น:

| tagType | ใช้เมื่อ | สี |
|---------|---------|-----|
| `buff` | ปรับดีขึ้น, เพิ่มพลัง | เขียว |
| `nerf` | ปรับแย่ลง, ลดพลัง | แดง |
| `new` | ฟีเจอร์ใหม่, ฮีโร่ใหม่ | ฟ้า |
| `event` | กิจกรรม, event พิเศษ | เหลือง |
| `fix` | แก้บัก, ปรับปรุง | ม่วง |

```json
{ "type": "ptag", "tagType": "new", "tagLabel": "ฮีโร่ใหม่" }
```

### 5. Quote — คำพูดเน้น

```json
{ "type": "quote", "content": "Ryoma จะเปลี่ยน meta ของ ROV อย่างสิ้นเชิง — นักวิเคราะห์จาก TGLabs" }
```

### 6. Rule — เส้นแบ่ง

```json
{ "type": "rule", "label": "สรุป" }
```

ใช้สำหรับจุดสำคัญที่อยากให้จำ เช่น "สรุป", "คะแนน", "วันที่"

---

## SEO กฎ

### Title Tag (seo_title)
- **60-70 ตัวอักษร**
- Format ที่แนะนำ: `{ชื่อเกม} {หัวข้อข่าวหลัก} | TopGame Thailand`
- ตัวอย่าง: `ROV อัปเดต 3.42 พร้อมฮีโร่ใหม่ Ryoma | TopGame Thailand`

### Meta Description (seo_description)
- **150-160 ตัวอักษร**
- สรุปข่าว 1-2 ประโยค ใส่ keyword หลัก

### Keywords ที่ควรมี
- ชื่อเกม (เช่น `ROV`, `Mobile Legends`, `Genshin Impact`)
- หมวดหมู่ (เช่น `ข่าวเกม`, `อัปเดต`, `รีวิว`)
- ชื่อตัวละคร/ไอเทม ถ้าเกี่ยวข้อง

### URL Slug
- Format: `/news/{game-id}-{topic-short}`
- ตัวอย่าง: `/news/rov-ryoma-new-hero`

---

## สิ่งที่ต้องหลีกเลี่ยง

| ผิด | ถูก |
|------|------|
| Clickbait หรือ Overclaim | บอกข้อเท็จจริงตรงๆ |
| ใช้คำว่า "สุดมันส์", "เจ๋งสุดๆ" | อธิบายว่าดีอย่างไร |
| ใส่ emoji ในเนื้อหา | หัวข้อย่อยเป็น text ธรรมดา |
| Copy จากแหล่งอื่นโดยตรง | Rewrite ใหม่ทั้งหมด |
| สรุปความเองเกินจริง | อ้างอิงแหล่งที่มา |
| ไม่ระบุ version/วันที่ | ระบุให้ชัดเจนเสมอ |
| ข่าวเก่าโดยไม่บอกวันที่ | ระบุวันที่อัปเดต |

---

## Hero Image

- ขนาดแนะนำ: **800×400px** ขึ้นไป
- ถ้าข่าวไม่มีรูป ใช้ placeholder: `https://picsum.photos/seed/{slug}/800/400`
- รูปต้องสื่อถึงเนื้อหาข่าว (ไม่ใช่ random)
- Caption (ถ้ามี): อธิบายสิ่งที่เห็นในรูป ระบุเครดิตถ้าจำเป็น

---

## Games Reference

| ID | ชื่อ | Genre | Keywords |
|----|------|-------|----------|
| tosm | Tree of Savior M | MMORPG | ToS M, ToS, Tree of Savior |
| rov | ROV | MOBA | ROV, Arena of Valor |
| mlbb | Mobile Legends | MOBA | ML, MLBB, Mobile Legends |
| pubg | PUBG Mobile | Battle Royale | PUBG, PUBG Mobile |
| ff | Free Fire | Battle Royale | Free Fire, FF |

---

## Read Time Calculation

สูตร: `ceil(word_count / 200)` นาที

| จำนวนคำ | Read Time |
|---------|-----------|
| < 200 | 1 นาที |
| 200-400 | 2 นาที |
| 400-600 | 3 นาที |
| 600-800 | 4 นาที |
| 800+ | 5+ นาที |