# คู่มือการลงบทความใน Supabase

## ข้อมูลเชื่อมต่อ Supabase

| รายการ | ค่า |
|--------|-----|
| **Supabase URL** | `https://pegajhvjrldsdzfyppcv.supabase.co` |
| **API Method** | REST API |

---

## Table หลักที่ใช้: `articles`

### Table Structure

| Field | Type | จำเป็น | คำอธิบาย |
|-------|------|--------|---------|
| `id` | UUID | Auto | ไม่ต้องใส่ |
| `slug` | VARCHAR(255) | ✓ | URL slug เช่น `rov-ryoma-new-hero` |
| `title` | VARCHAR(500) | ✓ | หัวข้อข่าว |
| `excerpt` | TEXT | ✓ | คำคัดย่อ 80-150 ตัวอักษร |
| `content` | TEXT | ✓ | **JSON blocks** (ไม่ใช่ HTML string) |
| `category` | ENUM | ✓ | `news`, `review`, `tips`, `live`, `tech`, `tournament` |
| `hero_image` | TEXT | | URL รูปหัวข่าว |
| `hero_caption` | TEXT | | คำบรรยายรูปหัวข่าว |
| `inline_images` | JSONB | | Array ของ inline images `[{url, caption}]` |
| `author_id` | UUID | ✓ | ID ของผู้เขียน |
| `read_time` | INTEGER | | เวลาอ่าน (นาที) |
| `rating` | DECIMAL | | คะแนน (สำหรับ review) |
| `view_count` | INTEGER | Auto | มีค่าเริ่มต้น 0 |
| `is_published` | BOOLEAN | ✓ | `true` = ลงข่าว, `false` = draft |
| `is_featured` | BOOLEAN | | `true` = ข่าวเด่น |
| `seo_title` | VARCHAR(255) | | SEO title (60-70 ตัวอักษร) |
| `seo_description` | TEXT | | SEO description (150-160 ตัวอักษร) |
| `published_at` | TIMESTAMPTZ | | วันที่ลงข่าว |
| `created_at` | TIMESTAMPTZ | Auto | วันที่สร้าง |
| `updated_at` | TIMESTAMPTZ | Auto | วันที่แก้ไขล่าสุด |

---

## Content Field (JSON Blocks)

**สำคัญ:** `content` เป็น **JSON array** ไม่ใช่ HTML string

### Valid Block Types

```json
// Paragraph
{ "type": "paragraph", "content": "ข้อความ" }

// Heading
{ "type": "heading", "level": 2, "content": "หัวข้อ" }

// Bullet list
{ "type": "bullet", "items": ["ข้อ 1", "ข้อ 2"] }

// Quote
{ "type": "quote", "content": "ข้อความ" }

// Rule (divider)
{ "type": "rule", "label": "สรุป" }

// Image
{ "type": "image", "imageUrl": "https://...", "imageCaption": "คำบรรยาย" }

// PTag (colored label)
{ "type": "ptag", "tagType": "buff", "tagLabel": "BUFF" }
```

### ตัวอย่าง Content ที่ถูกต้อง

```json
[
  { "type": "paragraph", "content": "ROV อัปเดต 3.42 มาพร้อมฮีโร่ใหม่ <strong>Ryoma</strong>" },
  { "type": "heading", "level": 2, "content": "ฮีโร่ใหม่" },
  { "type": "bullet", "items": ["Flash Slash — พุ่งผ่านศัตรู", "Shadow Dance — กระโดดหนี"] },
  { "type": "rule", "label": "สรุป" }
]
```

---

## วิธีลงบทความใหม่

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
    "excerpt": "ROV ปล่อยอัปเดต 3.42 มาพร้อมฮีโร่ใหม่ Ryoma นักดาบจากตะวันออก",
    "content": "[{\"type\":\"paragraph\",\"content\":\"ROV อัปเดต 3.42 มาพร้อมฮีโร่ใหม่ Ryoma...\"}]",
    "category": "news",
    "hero_image": "https://example.com/rov-ryoma.jpg",
    "author_id": "33333333-3333-3333-3333-333333333333",
    "read_time": 3,
    "is_published": true,
    "status": "published"
  }'
```

---

## วิธีดู Author ID

```bash
curl "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/users?select=id,name" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM"
```

Default author สำหรับ AI Generated: `33333333-3333-3333-3333-333333333333`

---

## วิธีแก้ไขบทความ

```bash
curl -X PATCH "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/articles?slug=eq.rov-ryoma-new-hero" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ROV อัปเดต 3.42 พร้อมฮีโร่ใหม่ Ryoma (อัปเดต)",
    "is_published": true,
    "published_at": "2026-03-20T00:00:00Z"
  }'
```

---

## วิธีลบบทความ

```bash
curl -X DELETE "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/articles?slug=eq.rov-ryoma-new-hero" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM"
```

---

## หมายเหตุ

- `content` ต้องเป็น **JSON string** (stringify JSON array แล้ว)
- ถ้าเป็น **Draft** (รอ approve) → ใส่ `is_published: false`
- ถ้าลงข่าวแล้ว → ใส่ `is_published: true` และกำหนด `published_at`
- slug ต้องไม่ซ้ำกับบทความที่มีอยู่
- ถ้าต้องการ field เพิ่ม → แจ้ง Developer เพื่อสร้างให้