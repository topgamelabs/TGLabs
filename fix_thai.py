#!/usr/bin/env python3
"""Fix Thai translations in fellows-db.json to sound natural."""

import json
import re

def fix_thai(text):
    if not text or text.strip() == "":
        return text
    if text.strip() == "ไม่มี":
        return text

    # Fix patterns where Thai words are incorrectly used before/after English
    # These are common machine-translation artifacts

    t = text

    # Fix double spaces
    t = re.sub(r' +', ' ', t)

    # Fix "นั้น" when it appears as a connector with English
    # "damage นั้น touch" -> "damage ที่ touch" or just remove awkward "นั้น"
    t = re.sub(r'(\w+) นั้น (\w+)', r'\1 \2', t)  # นั้น as connector between words

    # Fix "ไป" before verbs - common translation error
    # "ยิง ไป forward" -> "ยิง forward"
    t = re.sub(r'ยิง ไป ', 'ยิง ', t)
    t = re.sub(r'โจมตี ไป ', 'โจมตี ', t)
    t = re.sub(r'สร้างความเสียหาย ไป ', 'สร้างความเสียหาย ', t)
    t = re.sub(r'ให้ ไป ', 'ให้ ', t)
    t = re.sub(r'วาง ไป ', 'วาง ', t)
    t = re.sub(r'เรียก ไป ', 'เรียก ', t)

    # Fix redundant "นั้น" after action words
    t = re.sub(r'(โจมตี|สร้างความเสียหาย|ยิง|ให้|วาง|เรียก|รักษา|ฟื้นฟู|ปล่อย) นั้น ', r'\1 ', t)

    # Fix "ของ" appearing incorrectly
    t = re.sub(r'ของ นี้', 'ของตัวเอง', t)
    t = re.sub(r'ของ เขา', 'ของเขา', t)
    t = re.sub(r'ของ เธอ', 'ของเธอ', t)

    # Fix "ด้วย" when used as "with" but misplaced
    t = re.sub(r'ด้วย นี้', 'ด้วยตัวเอง', t)

    # Fix "ที่" when used as "that/which" incorrectly
    t = re.sub(r'(\w+) ที่ (\w+)', r'\1 \2', t)

    # Fix "ขณะ" appearing incorrectly
    t = re.sub(r'ขณะ นี้', 'ขณะนั้น', t)
    t = re.sub(r'ขณะ using', 'during', t)
    t = re.sub(r'ขณะ ทำงาน', 'ขณะทำงาน', t)

    # Fix "ขณะ" + ที่ patterns
    t = re.sub(r'ขณะ ที่', 'ขณะ', t)

    # Fix "เมื่อไหร่" -> "เมื่อ" when used with English
    t = re.sub(r'เมื่อไหร่ ', 'เมื่อ ', t)

    # Fix "ทุก" as "every" when it should be part of Thai phrases
    # "ทุก 0.5s" -> keep as is, it's correct

    # Fix "จากนั้น" spacing
    t = re.sub(r'จาก นั้น', 'จากนั้น', t)

    # Fix "หลัง จาก" -> "หลัง"
    t = re.sub(r'หลัง จาก', 'หลัง', t)

    # Fix "ลงมา" -> "ลง"
    t = re.sub(r'ลงมา โจมตี', 'ลงโจมตี', t)

    # Fix "เข้าสู่" spacing
    t = re.sub(r'เข้า สู่', 'เข้าสู่', t)

    # Fix "เป็นไปได้" spacing
    t = re.sub(r'เป็นไป ได้', 'เป็นไปได้', t)

    # Fix "ไม่" + verb patterns
    t = re.sub(r'ไม่ longer', 'ไม่ longer', t)  # keep as is

    # Fix "ให้" patterns - often misplaced
    t = re.sub(r'ให้ ให้', 'ให้', t)

    # Fix "ของ" + number patterns
    t = re.sub(r'ของ (\d+)', r'ของ \1', t)

    # Fix "พร้อม" spacing
    t = re.sub(r'พร้อม ด้วย', 'พร้อมด้วย', t)

    # Fix "เกี่ยวกับ" spacing
    t = re.sub(r'เกี่ยว กับ', 'เกี่ยวกับ', t)

    # Fix "โดย" appearing twice
    t = re.sub(r'โดย โดย', 'โดย', t)

    # Fix "อย่าง" before English adjectives
    t = re.sub(r'อย่าง รวดเร็ว', 'อย่างรวดเร็ว', t)

    # Fix "ใน" before English
    t = re.sub(r'ใน (\w)', r'ใน\1', t)

    # Fix "ไป" after verbs
    t = re.sub(r'ยิง forward', 'ยิง forward', t)  # already correct

    # Fix "สำหรับ" patterns
    t = re.sub(r'สำหรับ (\d+)s', r'สำหรับ \1', t)  # "สำหรับ 5s" -> "5 วินาที" but keep for now

    # Fix common broken Thai -> natural Thai mappings
    replacements = [
        # Remove redundant connectors
        (r'^ทุก ที่สอง', 'ทุก 2 วินาที'),
        (r'ทุก ที่สอง', 'ทุก 2 วินาที'),
        (r'ทุก (\d+) ที่สอง', r'ทุก \1 วินาที'),
        (r'per ที่สอง', 'ต่อวินาที'),
        (r'for (\d+)s', r'เป็นเวลา \1 วินาที'),

        # Fix "ไม่มี" appearing in skill descriptions incorrectly
        # Already handled at top

        # Fix specific common patterns
        (r'ไม่ มี', 'ไม่มี'),
        (r'โดย เฉพาะ', 'โดยเฉพาะ'),
        (r'ทั้ง หมด', 'ทั้งหมด'),
        (r'ตัว เอง', 'ตัวเอง'),
        (r'จาก นั้น', 'จากนั้น'),
        (r'ใน ขณะ', 'ในขณะ'),
        (r'เป็น เวลา', 'เป็นเวลา'),
        (r'อยู่ ใน', 'อยู่ใน'),
        (r'เข้า สู่', 'เข้าสู่'),
        (r'อย่าง ไร', 'อย่างไร'),
        (r'เมื่อ ไหร่', 'เมื่อไหร่'),
        (r'แต่ ละ', 'แต่ละ'),
        (r'ไม่ สามารถ', 'ไม่สามารถ'),
        (r'ของ คุณ', 'ของคุณ'),
        (r'ของ เขา', 'ของเขา'),
        (r'ของ เธอ', 'ของเธอ'),
        (r'ของ มัน', 'ของมัน'),
        (r'ให้ กับ', 'ให้กับ'),
        (r'ให้ แก่', 'ให้แก่'),
        (r'เพิ่ม ความ', 'เพิ่มความ'),
        (r'ลด ความ', 'ลดความ'),
        (r'เป้า หมาย', 'เป้าหมาย'),
        (r'พื้น ที่', 'พื้นที่'),
        (r'ศัก ดิ์', 'ศักดิ์'),  # in ศักดิ์สิทธิ์
        (r'ความ เร็ว', 'ความเร็ว'),
        (r'ความ เสียหาย', 'ความเสียหาย'),
        (r'ระยะ เวลา', 'ระยะเวลา'),
        (r'ทิศ ทาง', 'ทิศทาง'),
        (r'ด้าน หลัง', 'ด้านหลัง'),
        (r'ครั้ง ที่', 'ครั้งที่'),
        (r'เวลา ที่', 'เวลาที่'),
        (r'ส่วน ของ', 'ส่วนของ'),
        (r'หลัง จาก', 'หลังจาก'),
        (r'ตาม หลัง', 'ตามหลัง'),
        (r'พร้อม กับ', 'พร้อมกับ'),
        (r'ใน ระหว่าง', 'ในระหว่าง'),
        (r'ด้วย ตัวเอง', 'ด้วยตัวเอง'),
        (r'เกี่ยว ข้อง', 'เกี่ยวข้อง'),
        (r'โดย ไม่', 'โดยไม่'),
        (r'ก่อน ที่จะ', 'ก่อนที่จะ'),
        (r'หลัง ที่จะ', 'หลังที่จะ'),
        (r'เมื่อ ที่', 'เมื่อ'),
        (r'แม้ ว่า', 'แม้ว่า'),
        (r'เพราะ ว่า', 'เพราะว่า'),
        (r'ดัง นั้น', 'ดังนั้น'),
        (r'อย่าง ไรก็', 'อย่างไรก็'),
        (r'ทั้ง นี้', 'ทั้งนี้'),
        (r'ใน ที่', 'ในที่'),
        (r'จาก ใน', 'จากใน'),
        (r'ไป ยัง', 'ไปยัง'),
        (r'มา ยัง', 'มายัง'),
        (r'อยู่ บน', 'อยู่บน'),
        (r'ลง บน', 'ลงบน'),
        (r'ขึ้น บน', 'ขึ้นบน'),
        (r'ไป บน', 'ไปบน'),
        (r'มา บน', 'มาบน'),
        (r'ใน บน', 'ในบน'),
        (r'จาก บน', 'จากบน'),
        (r'อยู่ ใต้', 'อยู่ใต้'),
        (r'ลง ใต้', 'ลงใต้'),
        (r'ไป ใต้', 'ไปใต้'),
        (r'มา ใต้', 'มาตง'),
        (r'ใน ใต้', 'ในใต้'),
        (r'จาก ใต้', 'จากใต้'),
        (r'รอบ ข้าง', 'รอบข้าง'),
        (r'ใน รอบ', 'ในรอบ'),
        (r'ไป รอบ', 'ไปรอบ'),
        (r'มา รอบ', 'มารอบ'),
        (r'ลง ใน', 'ลงใน'),
        (r'ขึ้น ใน', 'ขึ้นใน'),
        (r'ไป ใน', 'ไปใน'),
        (r'มา ใน', 'มาใน'),
        (r'จาก ใน', 'จากใน'),
        (r'ไป จาก', 'ไปจาก'),
        (r'มา จาก', 'มาจาก'),
        (r'ลง จาก', 'ลงจาก'),
        (r'ขึ้น จาก', 'ขึ้นจาก'),
        (r'ไป ก่อน', 'ไปก่อน'),
        (r'มา ก่อน', 'มาก่อน'),
        (r'ลง ก่อน', 'ลงก่อน'),
        (r'ขึ้น ก่อน', 'ขึ้นก่อน'),
        (r'ไป หลัง', 'ไปหลัง'),
        (r'มา หลัง', 'มาหลัง'),
        (r'ลง หลัง', 'ลงหลัง'),
        (r'ขึ้น หลัง', 'ขึ้นหลัง'),
        (r'ไป ระหว่าง', 'ไประหว่าง'),
        (r'มา ระหว่าง', 'มาระหว่าง'),
        (r'ลง ระหว่าง', 'ลงระหว่าง'),
        (r'ขึ้น ระหว่าง', 'ขึ้นระหว่าง'),
        (r'อยู่ ระหว่าง', 'อยู่ระหว่าง'),
        (r'ไป ตลอด', 'ไปตลอด'),
        (r'มา ตลอด', 'มาตลอด'),
        (r'ลง ตลอด', 'ลงตลอด'),
        (r'ขึ้น ตลอด', 'ขึ้นตลอด'),
        (r'อยู่ ตลอด', 'อยู่ตลอด'),
        (r'ใช้ งาน', 'ใช้งาน'),
        (r'ทำ งาน', 'ทำงาน'),
        (r'เริ่ม งาน', 'เริ่มงาน'),
        (r'หยุด งาน', 'หยุดงาน'),
        (r'เสร็จ งาน', 'เสร็จงาน'),
        (r'รับ งาน', 'รับงาน'),
        (r'ส่ง งาน', 'ส่งงาน'),
        (r'ทำ การ', 'ทำการ'),
        (r'รับ การ', 'รับการ'),
        (r'ส่ง การ', 'ส่งการ'),
        (r'ได้ รับ', 'ได้รับ'),
        (r'ไม่ ได้', 'ไม่ได้'),
        (r'สามารถ ได้', 'สามารถได้'),
        (r'ควร จะ', 'ควรจะ'),
        (r'ต้อง จะ', 'ต้องจะ'),
        (r'อาจ จะ', 'อาจจะ'),
        (r'น่า จะ', 'น่าจะ'),
        (r'กำลัง จะ', 'กำลังจะ'),
        (r'กำลัง ทำ', 'กำลังทำ'),
        (r'กำลัง ใช้', 'กำลังใช้'),
        (r'กำลัง รับ', 'กำลังรับ'),
        (r'กำลัง ส่ง', 'กำลังส่ง'),
    ]

    for old, new in replacements:
        t = re.sub(old, new, t)

    # Final cleanup - remove double spaces
    t = re.sub(r' +', ' ', t)
    t = t.strip()

    return t


def fix_field(text):
    """Fix a single text field."""
    if not text:
        return text
    if text.strip() == "":
        return text

    # Don't touch pure English strings (e.g., just "ไม่มี" is a valid Thai string meaning "None")
    # Check if it's mostly English
    english_count = len(re.findall(r'[a-zA-Z]', text))
    total_chars = len(text)
    if english_count / total_chars > 0.7:
        # Mostly English - return as is but clean up spacing
        return re.sub(r' +', ' ', text).strip()

    # Mixed content - fix Thai
    return fix_thai(text)


def fix_fellow(fellow):
    """Fix all text fields in a fellow entry."""
    fields_to_fix = [
        'leaderSkill', 'basicAttack', 'skill1', 'skill2', 'skill3', 'awakenSkill'
    ]

    for field in fields_to_fix:
        if field in fellow and fellow[field]:
            fellow[field] = fix_field(fellow[field])

    # Fix tierlist notes
    if 'tierlist' in fellow and fellow['tierlist'] and 'notes' in fellow['tierlist']:
        notes = fellow['tierlist']['notes']
        if notes and notes.strip():
            fellow['tierlist']['notes'] = fix_field(notes)

    return fellow


def main():
    input_file = 'content/tos-m/fellows-db.json'
    output_file = 'content/tos-m/fellows-db.json'

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    fixed_data = []
    for fellow in data:
        fixed_fellow = fix_fellow(fellow)
        fixed_data.append(fixed_fellow)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, ensure_ascii=False, indent=2)

    print(f"Fixed {len(fixed_data)} fellows")


if __name__ == '__main__':
    main()
