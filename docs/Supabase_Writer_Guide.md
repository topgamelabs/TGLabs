# คู่มือการลงบทความใน Supabase

## ข้อมูลเชื่อมต่อ Supabase

| รายการ | ค่า |
|--------|-----|
| **Supabase URL** | `https://pegajhvjrldsdzfyppcv.supabase.co` |
| **Supabase Email** | (สอบถาม PL สำหรับ login) |
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
| `content` | TEXT | ✓ | เนื้อหาข่าว (HTML) |
| `category` | ENUM | ✓ | `news`, `review`, `tips`, `live`, `tech`, `tournament` |
| `hero_image` | TEXT | | URL รูปหัวข่าว |
| `hero_caption` | TEXT | | คำบรรยายรูป |
| `author_id` | UUID | ✓ | ID ของผู้เขียน (ดูได้จาก table `users`) |
| `read_time` | INTEGER | | เวลาอ่าน (นาที) |
| `rating` | DECIMAL | | คะแนน (สำหรับ review) |
| `view_count` | INTEGER | Auto | มีค่าเริ่มต้น 0 |
| `is_published` | BOOLEAN | ✓ | `true` = ลงข่าว, `false` = draft |
| `is_featured` | BOOLEAN | | `true` = ข่าวเด่น |
| `meta_title` | VARCHAR(255) | | SEO title (60-70 ตัวอักษร) |
| `meta_description` | TEXT | | SEO description (150-160 ตัวอักษร) |
| `published_at` | TIMESTAMPTZ | | วันที่ลงข่าว |
| `created_at` | TIMESTAMPTZ | Auto | วันที่สร้าง |
| `updated_at` | TIMESTAMPTZ | Auto | วันที่แก้ไขล่าสุด |

---

## วิธีลงบทความใหม่

### วิธีที่ 1: ผ่าน Supabase Dashboard (GUI)

1. ไปที่ https://supabase.com/dashboard/project/pegajhvjrldsdzfyppcv
2. เลือก **Table Editor** → **articles**
3. คลิก **Insert row**
4. ใส่ข้อมูลตาม table ด้านบน
5. คลิก **Save**

### วิธีที่ 2: ผ่าน API (curl)

```bash
curl -X POST "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/articles" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "slug": "rov-ryoma-new-hero",
    "title": "ROV อัปเดต 3.42 พร้อมฮีโร่ใหม่ Ryoma",
    "excerpt": "ROV ปล่อยอัปเดต 3.42 วันที่ 20 มีนาคม 2026 มาพร้อมฮีโร่ใหม่ Ryoma นักดาบจากตะวันออก พร้อมปรับสมดุลฮีโร่หลายตัว",
    "content": "<p>ย่อหน้าแรก...</p><h2>หัวข้อย่อย</h2>...",
    "category": "news",
    "hero_image": "https://example.com/rov-ryoma.jpg",
    "author_id": "33333333-3333-3333-3333-333333333333",
    "read_time": 3,
    "is_published": true
  }'
```

---

## วิธีดู Author ID

```bash
curl "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/users?select=id,name" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"
```

Default author สำหรับ AI Generated: `33333333-3333-3333-3333-333333333333`

---

## วิธีแก้ไขบทความ

```bash
curl -X PATCH "https://pegajhvjrldsdzfyppcv.supabase.co/rest/v1/articles?slug=eq.rov-ryoma-new-hero" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
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
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]"
```

---

## หมายเหตุ

- ถ้าเป็น **Draft** (รอ approve) → ใส่ `is_published: false`
- ถ้าลงข่าวแล้ว → ใส่ `is_published: true` และกำหนด `published_at`
- slug ต้องไม่ซ้ำกับบทความที่มีอยู่
- ถ้าต้องการ field เพิ่ม → แจ้งปู (Developer) เพื่อสร้างให้