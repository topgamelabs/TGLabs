# TGLabs Content Guidelines

## Brand DNA

- **ชื่อเว็บ:** TopGame Thailand / TGLabs
- **โทน:** ตรงไปตรงมา เป็นกันเอง ไม่หวาน ไม่ clickbait
- **ภาษา:** ไทย (แต่ title ใน meta อาจเป็น EN ก็ได้)
- **ห้ามใช้ emoji ในเนื้อหาข่าว** — ยกเว้น thumbnail/caption

---

## โครงสร้างข่าว

### 1. Title
- มีชื่อเกมขึ้นต้นหรืออยู่ใน title ชัดเจน
- ตัวอย่าง: `"Genshin Impact เวอร์ชัน 5.0 มาพร้อมพื้นที่ใหม่ Natlan"`
- ห้าม: `"สุดมันส์! Genshin ปล่อยอัปเดตเวอร์เมเปิ้ลสุดเจ๋ง!"`

### 2. Excerpt (บทคัดย่อ)
- **80-150 ตัวอักษร**
- สรุปใจความสำคัญให้น่าคลิกแต่ไม่เกินจริง
- ตอบคำถาม: อะไร / เกมอะไร / ผลกระทบอะไร

### 3. Content Structure
```
ย่อหน้าแรก (hook)   → สรุปข่าว 2-3 บรรทัด ตอบคำถาม "อะไร / เกมอะไร / เมื่อไหร่"
<h2> หัวข้อย่อยที่ 1    → อธิบายรายละเอียดหลัก
<h3> หัวข้อย่อย          → (ถ้าต้องแยกประเด็นเพิ่มเติม)
พารากราฟ             → เนื้อหาประกอบ
<div class="highlight-box"> → คำสรุป / จุดสำคัญ / คำที่น่าจดจำ
<ul class="bullet-red">  → bullet points ที่มีกรอบแดง (ถ้าเหมาะสม)
<h2> หัวข้อย่อยที่ 2    → รายละเอียดเพิ่มเติม
<p> สรุปปิดท้าย        → บอกผลกระทบ / สิ่งที่ต้องจับตา
```

### 4. การใช้ Highlight Box
ใช้สำหรับ:
- คำสรุปสั้นๆ ที่น่าจดจำ (เช่น "ยังคงเล่นได้แม้มือถือเครื่องเก่า")
- จุดเด่นที่อยากให้ผู้อ่านจำ
- Warning หรือสิ่งที่ต้องระวัง

Format:
```html
<div class="highlight-box">
  <h4>📌 สรุป</h4>
  <ul>
    <li>ข้อ 1</li>
    <li>ข้อ 2</li>
  </ul>
</div>
```

### 5. การใช้ Bullet กรอบแดง
ใช้เมื่อเนื้อหามี list ที่ต้องการเน้น:

```html
<ul class="bullet-red">
  <li>ข้อมูลที่ 1</li>
  <li>ข้อมูลที่ 2</li>
</ul>
```

### 6. Score/Rating Box
สำหรับรีวิวหรือข่าวที่ต้องมีการให้คะแนน:

```html
<div class="score-box">
  <h4>คะแนนรีวิว</h4>
  <table>
    <tr><td>เนื้อเรื่อง</td><td>8/10</td></tr>
    <tr><td>Gameplay</td><td>8.5/10</td></tr>
  </table>
</div>
```

### 7. Tags/Labels
- ใช้ tag จากระบบที่กำหนด: `news`, `review`, `tierlist`, `patch`, `event`
- เพิ่ม game_id ให้ตรงกับเกมที่ข่าวเกี่ยวข้อง

---

## SEO กฎ

### Title Tag (Meta Title)
- **60-70 ตัวอักษร**
- Format ที่แนะนำ: `{ชื่อเกม} {หัวข้อข่าวหลัก} | TopGame Thailand`
- ตัวอย่าง: `R OV อัปเดต 3.42 พร้อมฮีโร่ใหม่ Ryoma | TopGame Thailand`

### Meta Description
- **150-160 ตัวอักษร**
- สรุปข่าว 1-2 ประโยค ใส่ keyword หลัก

### Keywords ที่ควรมี
- ชื่อเกม (เช่น `ROV`, `Mobile Legends`, `Genshin Impact`)
- หมวดหมู่ (เช่น `ข่าวเกม`, `อัปเดต`, `รีวิว`)
- ชื่อตัวละคร/ไอเทม ถ้าเกี่ยวข้อง

### URL Slug
- Format: `/news/{game-id}-{topic-short}`
- ตัวอย่าง: `/news/rov-ryoma-new-hero`

### Open Graph
- `og:title` = Title (ไม่ต้องมี brand suffix)
- `og:description` = Excerpt
- `og:image` = Hero image (800x400px ขึ้นไป)
- `og:type` = article
- `article:published_time` = วันที่ลงข่าว

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

## ตัวอย่างการเขียน

### ดี ✓
```
Title: Genshin Impact เวอร์ชัน 5.0 มาพร้อมพื้นที่ใหม่ Natlan พร้อมรีวิว

Excerpt: Genshin Impact ปล่อยอัปเดต 5.0 วันที่ 15 มกราคม 2026 
มาพร้อมพื้นที่ใหม่ Natlan, ฮีโร่ใหม่ 2 ตัว และระบบ Pyro ...

Content:
<p>Genshin Impact เวอร์ชัน 5.0 อัปเดตวันที่ 15 มกราคม 2026 
มาพร้อมพื้นที่ใหม่ Natlan ดินแดนแห่งไฟที่ผู้เล่นรอคอยมานาน...</p>

<h2>Natlan — ดินแดนแห่งไฟ</h2>
<p>พื้นที่ใหม่มีขนาดใหญ่กว่า Fontaine 1.5 เท่า มาพร้อม...</p>

<h2>ฮีโร่ใหม่ 2 ตัว</h2>
<p>Citlalli (5-star Cryo) และ Ifa (4-star Dendro) เข้ามาในรอบ Wish...</p>

<p>อัปเดตนี้ถือว่าคุ้มค่าสำหรับผู้เล่นที่ชอบสำรวจเนื้อหาใหม่ 
คาดว่า MiHoYo จะปล่อย event พิเศษสำหรับ Natlan อีก 2 event ในเดือนกุมภาพันธ์</p>
```

### ไม่ดี ✗
```
Title: !!SHOCKING!! Genshin 5.0 มาแล้ว! ไม่เชื่อสิ่งที่เกิดขึ้น!

Excerpt: มาแล้วจ้า! เวอร์ชันใหม่สุดมันส์ ทุกคนต้องเล่น! 
ข่าวนี้เด็ดมากจริงๆ

Content:
🔥 Genshin 5.0 มาแล้วจ้าาาา!! 🎮🎮🎮
 ทุกคนต้องรีบเข้าไปเล่นเลยนะคะ! 
 สุดๆไปเลย! ดีสุดๆ! Amazing! 😍😍😍
```

---

## Hero Image

- ขนาดแนะนำ: **800×400px** ขึ้นไป
- ถ้าข่าวไม่มีรูป ใช้ placeholder: `https://picsum.photos/seed/{slug}/800/400`
- รูปต้องสื่อถึงเนื้อหาข่าว (ไม่ใช่ random)
- Caption (ถ้ามี): อธิบายสิ่งที่เห็นในรูป ระบุเครดิตถ้าจำเป็น

---

## Games Reference (สำหรับ Tag และ SEO)

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

---

## Related Articles

เมื่อลงข่าว ให้เพิ่ม `related_articles` (ถ้ามี) ใน metadata เพื่อให้ระบบแสดงข่าวที่เกี่ยวข้อง 2-3 ข่าว