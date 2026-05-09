# TGLabs Writer Handbook

## ภาพรวมระบบ

ระบบใหม่: content เก็บเป็น **JSON blocks** ไม่ใช่ HTML string

| ก่อน | หลัง |
|------|------|
| `<p>ข้อความ</p><h2>หัวข้อ</h2>` | `[{type:"paragraph",content:"ข้อความ"},{type:"heading",level:2,content:"หัวข้อ"}]` |
| HTML string ต้องใช้ `dangerouslySetInnerHTML` | JSON array แปลงเป็น React components อัตโนมัติ |

**ประโยชน์:** Component ทำงานได้ถูกต้อง (PTag, Rule, etc.), inline images รองรับเต็มรูปแบบ, content structure ชัดเจน

---

## Block Types ที่รองรับ

### paragraph
```json
{ "type": "paragraph", "content": "ข้อความย่อหน้า (รองรับ <strong>, <em> ได้)" }
```

### heading
```json
{ "type": "heading", "level": 2, "content": "หัวข้อย่อย" }
```
- `level`: 1, 2, หรือ 3

### bullet
```json
{ "type": "bullet", "items": ["ข้อ 1", "ข้อ 2", "ข้อ 3"] }
```

### quote
```json
{ "type": "quote", "content": "ข้อความที่อยากเน้น" }
```

### rule
```json
{ "type": "rule", "label": "สรุป" }
```
- แสดงเป็นเส้นแบ่งกลางหน้า

### image (Inline Image)
```json
{ "type": "image", "imageUrl": "https://...", "imageCaption": "คำบรรยายรูป" }
```
- รูปจะถูกจัดเก็บใน `inline_images` field แยก

### ptag
```json
{ "type": "ptag", "tagType": "buff", "tagLabel": "BUFF" }
```
- ใช้สำหรับ label/tag ที่เป็นสี เช่น `BUFF`, `NERF`, `NEW`, `EVENT`, `FIX`

---

## ตัวอย่าง Content เต็มรูปแบบ

```json
[
  { "type": "paragraph", "content": "ROV อัปเดต 3.42 วันที่ 20 มีนาคม 2026 มาพร้อมฮีโร่ใหม่ <strong>Ryoma</strong> นักดาบจากตะวันออก พร้อมปรับสมดุลฮีโร่หลายตัว" },
  { "type": "heading", "level": 2, "content": "ฮีโร่ใหม่ Ryoma" },
  { "type": "paragraph", "content": "Ryoma เป็นฮีโร่ระยะไกลที่มีความสามารถในการ thrust ทำลายล้าง สกิลหลัก Flash Slash สามารถพุ่งผ่านศัตรูได้ 3 ตัวพร้อมโมเดิร์น" },
  { "type": "bullet", "items": ["Flash Slash — พุ่งผ่านศัตรู 3 ตัว", "Shadow Dance — กระโดดหนีเมื่อ HP ต่ำ", "Katana Storm — Ultimate ระดับ AOE"] },
  { "type": "rule", "label": "สรุป" },
  { "type": "paragraph", "content": "ฮีโร่ใหม่นี้เหมาะสำหรับผู้เล่นที่ชอบ aggressive playstyle คาดว่าจะมี impact สูงใน meta ปัจจุบัน" }
]
```

---

## วิธีส่ง Article ไป Supabase

### ผ่าน API (curl)

```bash
curl -X POST "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/articles" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "slug": "rov-ryoma-new-hero",
    "title": "ROV อัปเดต 3.42 พร้อมฮีโร่ใหม่ Ryoma",
    "excerpt": "ROV ปล่อยอัปเดต 3.42 มาพร้อมฮีโร่ใหม่ Ryoma นักดาบจากตะวันออก พร้อมปรับสมดุลฮีโร่หลายตัว",
    "content": "[{\"type\":\"paragraph\",\"content\":\"ROV อัปเดต 3.42 มาพร้อมฮีโร่ใหม่ Ryoma...\"},{\"type\":\"heading\",\"level\":2,\"content\":\"ฮีโร่ใหม่ Ryoma\"}]",
    "category": "news",
    "hero_image": "https://example.com/rov-ryoma.jpg",
    "hero_caption": "ภาพตัวละคร Ryoma",
    "author_id": "33333333-3333-3333-3333-333333333333",
    "read_time": 3,
    "is_published": true
  }'
```

**สำคัญ:** `content` ต้องเป็น JSON string ที่ stringify แล้ว (ใส่ quotes ครอบ JSON array)

### หรือ POST แยก field

```json
{
  "title": "...",
  "excerpt": "...",
  "content": "[{...},{...}]",
  "slug": "rov-ryoma-new-hero",
  "category": "news",
  "hero_image": "https://...",
  "hero_caption": "...",
  "author_id": "33333333-3333-3333-3333-333333333333",
  "read_time": 3,
  "is_published": true,
  "status": "published"
}
```

---

## การใช้งาน Inline Images

ถ้าข่าวมีรูปในเนื้อหา (นอกจาก hero image):

1. ใส่ block `{ "type": "image", "imageUrl": "...", "imageCaption": "..." }`
2. ระบบจะดึง URL ทั้งหมดไปเก็บใน `inline_images` JSON field อัตโนมัติ
3. รูปจะถูก render ในตำแหน่งที่เหมาะสม

---

## PTag Tags สำหรับข่าวประเภทต่างๆ

| tagType | ใช้เมื่อ | สี |
|---------|---------|-----|
| `buff` | ปรับดีขึ้น, เพิ่มพลัง | เขียว |
| `nerf` | ปรับแย่ลง, ลดพลัง | แดง |
| `new` | ฟีเจอร์ใหม่, ฮีโร่ใหม่ | ฟ้า |
| `event` | กิจกรรม, event พิเศษ | เหลือง |
| `fix` | แก้บัก, ปรับปรุง | ม่วง |

ตัวอย่าง:
```json
{ "type": "ptag", "tagType": "new", "tagLabel": "ฮีโร่ใหม่" }
{ "type": "ptag", "tagType": "nerf", "tagLabel": "NERF" }
```

---

## ตรวจสอบ content ก่อนส่ง

Content ที่ส่งต้องเป็น valid JSON array — ตรวจสอบก่อน POST ด้วย:

```javascript
const blocks = [...] // your content
console.log(JSON.stringify(blocks)) // ต้องไม่มี syntax error
```

ถ้า JSON invalid, API จะ return error

---

## วิธีดู Article ที่มีอยู่แล้ว

```bash
curl "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/articles?select=slug,title,content&limit=3" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM"
```

---

## Error Handling

| Error | สาเหตุ | แก้ |
|-------|--------|-----|
| `content is not valid JSON` | JSON syntax ผิด | ตรวจ JSON format |
| `column does not exist` | field ผิดชื่อ | ดู table structure |
| `slug must be unique` | slug ซ้ำ | เปลี่ยน slug |

---

## Migration (สำหรับ Developer)

ถ้ามี article ที่ยังเป็น HTML string อยู่ รัน:
```bash
node scripts/migrate-to-json-blocks.js
```

Script นี้จะ:
1. อ่าน articles ที่มี HTML content
2. แปลงเป็น JSON blocks
3. อัปเดตกลับไป Supabase