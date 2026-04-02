#!/usr/bin/env python3
"""Comprehensive Thai translation fixer for fellows-db.json"""

import json
import re

def fix_text(text):
    """Fix common Thai translation patterns while preserving English."""
    if not text or not isinstance(text, str):
        return text

    # Don't touch pure English or empty strings
    if text.strip() in ['ไม่มี', '', 'ไม่']:
        return text

    # Skip if mostly English (>60% English characters)
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total_chars = len(text.replace(' ', ''))
    if total_chars > 0 and english_chars / total_chars > 0.6:
        # Mostly English - just clean spacing
        return re.sub(r' +', ' ', text).strip()

    t = text

    # ===================
    # PHASE 1: Fix spacing issues
    # ===================

    # Fix double spaces
    t = re.sub(r' +', ' ', t)

    # Fix spaces before punctuation
    t = re.sub(r' +([,\.])', r'\1', t)

    # Fix spaces between Thai words and English words that should be joined
    # Pattern: Thai consonant/vowel followed by space then English word
    # Keep as is for now - these are usually intentional separators

    # ===================
    # PHASE 2: Fix common translation errors
    # ===================

    # Fix "นั้น" connector issues - ที่นั้น should not have extra spaces
    t = re.sub(r'(\w+) นั้น (\w+)', r'\1 \2', t)  # นั้น as connector
    t = re.sub(r' นั้น นั้น', ' นั้น', t)
    t = re.sub(r'นั้น นั้น', 'นั้น', t)

    # Fix "ไป" before verbs (common translation error)
    verbs_to_fix = [
        'ยิง', 'โจมตี', 'สร้างความเสียหาย', 'ให้', 'วาง', 'เรียก',
        'รักษา', 'ฟื้นฟู', 'ปล่อย', 'เพิ่ม', 'ลด', 'เรียก',
        'ทำ', 'ใช้', 'รอ', 'มา', 'ไป', 'ลง', 'ขึ้น'
    ]
    for verb in verbs_to_fix:
        t = re.sub(rf'{verb} ไป ', rf'{verb} ', t)
        t = re.sub(rf'{verb} ไป\.', rf'{verb}.', t)
        t = re.sub(rf'{verb} ไป,', rf'{verb},', t)

    # Fix "นั้น" after action words (should be removed or repositioned)
    action_words = ['โจมตี', 'สร้างความเสียหาย', 'ยิง', 'ให้', 'วาง', 'เรียก',
                    'รักษา', 'ฟื้นฟู', 'ปล่อย', 'เคลื่อน', 'กระโดด', 'พุ่ง',
                    'ฟาด', 'ทุบ', 'ซัด', 'หมุน', 'แทง', 'ฟื้น']
    for word in action_words:
        t = re.sub(rf'{word} นั้น ', rf'{word} ', t)

    # Fix "ของ" separation issues
    t = re.sub(r'ของ นี้', 'ของตัวเอง', t)
    t = re.sub(r'ของ ตัวเอง', 'ของตัวเอง', t)
    t = re.sub(r'ของ เขา', 'ของเขา', t)
    t = re.sub(r'ของ เธอ', 'ของเธอ', t)
    t = re.sub(r'ของ มัน', 'ของมัน', t)
    t = re.sub(r'ของ คุณ', 'ของคุณ', t)
    t = re.sub(r'ของ (\w+)', r'ของ\1', t)

    # Fix "ด้วย" issues
    t = re.sub(r'ด้วย นี้', 'ด้วยตัวเอง', t)
    t = re.sub(r'ด้วย ตัวเอง', 'ด้วยตัวเอง', t)

    # Fix "ที่" connector issues
    t = re.sub(r'(\w+) ที่ (\w+)', r'\1 \2', t)
    t = re.sub(r'ที่ นั้น', 'ที่', t)
    t = re.sub(r'ที่ ตัว', 'ที่ตัว', t)

    # Fix "ขณะ" issues
    t = re.sub(r'ขณะ นี้', 'ขณะนั้น', t)
    t = re.sub(r'ขณะ ทำงาน', 'ขณะทำงาน', t)
    t = re.sub(r'ขณะ using', 'ขณะใช้', t)

    # Fix "เมื่อไหร่" -> "เมื่อ" for simple time references
    t = re.sub(r'เมื่อไหร่ ', 'เมื่อ ', t)

    # Fix "ให้" duplication
    t = re.sub(r'ให้ ให้', 'ให้', t)

    # Fix "โดย" duplication
    t = re.sub(r'โดย โดย', 'โดย', t)

    # Fix common compound words that should be joined
    compound_fixes = [
        # Time/space connectors
        (r'ทุก ที่สอง', 'ทุก 2 วินาที'),
        (r'ทุก (\d+) ที่สอง', r'ทุก \1 วินาที'),
        (r'per ที่สอง', 'ต่อวินาที'),
        (r'for (\d+)s', r'เป็นเวลา \1 วินาที'),
        (r'สำหรับ (\d+)s', r'\1 วินาที'),

        # Common Thai word fixes
        (r'ไม่ มี', 'ไม่มี'),
        (r'โดย เฉพาะ', 'โดยเฉพาะ'),
        (r'ทั้ง หมด', 'ทั้งหมด'),
        (r'ตัว เอง', 'ตัวเอง'),
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
        (r'ให้ กับ', 'ให้กับ'),
        (r'เพิ่ม ความ', 'เพิ่มความ'),
        (r'ลด ความ', 'ลดความ'),
        (r'เป้า หมาย', 'เป้าหมาย'),
        (r'พื้น ที่', 'พื้นที่'),
        (r'ศัก ดิ์', 'ศักดิ์'),
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
        (r'ลง ใน', 'ลงใน'),
        (r'ขึ้น ใน', 'ขึ้นใน'),
        (r'ไป ใน', 'ไปใน'),
        (r'มา ใน', 'มาใน'),
        (r'จาก ใน', 'จากใน'),
        (r'ไป จาก', 'ไปจาก'),
        (r'มา จาก', 'มาจาก'),
        (r'ลง จาก', 'ลงจาก'),
        (r'ขึ้น จาก', 'ขึ้นจาก'),
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
        (r'โดย บน', 'โดยบน'),
        (r'ใน การ', 'ในการ'),
        (r'ของ การ', 'ของการ'),
        (r'จาก การ', 'จากการ'),
        (r'แล้ว ไป', 'แล้วไป'),
        (r'แล้ว มา', 'แล้วมา'),
        (r'แล้ว ลง', 'แล้วลง'),
        (r'แล้ว ขึ้น', 'แล้วขึ้น'),
        (r'แล้ว กลับ', 'แล้วกลับ'),
        (r'ขึ้น มา', 'ขึ้นมา'),
        (r'ลง ไป', 'ลงไป'),
        (r'ขึ้น ไป', 'ขึ้นไป'),
        (r'มา จาก', 'มาจาก'),
        (r'กลับ มา', 'กลับมา'),
        (r'กลับ ไป', 'กลับไป'),
        (r'เปลี่ยน เป็น', 'เปลี่ยนเป็น'),
        (r'เป็น ฐานะ', 'เป็นฐานะ'),
        (r'ใน ฐานะ', 'ในฐานะ'),
        (r'ใน รูปแบบ', 'ในรูปแบบ'),
        (r'เป็น รูปแบบ', 'เป็นรูปแบบ'),
        (r'ใน ระหว่าง', 'ในระหว่าง'),
        (r'เป็น เวลา', 'เป็นเวลา'),
        (r'เมื่อ เวลา', 'เมื่อเวลา'),
        (r'ใน เวลา', 'ในเวลา'),
        (r'ตั้ง แต่', 'ตั้งแต่'),
        (r'ไป ถึง', 'ไปถึง'),
        (r'มา ถึง', 'มาถึง'),
        (r'ถึง ที่', 'ถึงที่'),
        (r'ใน นี้', 'ในนี้'),
        (r'ใน นั้น', 'ในนั้น'),
        (r'ที่ นี้', 'ที่นี้'),
        (r'ที่ นั้น', 'ที่นั้น'),
        (r'เช่น นี้', 'เช่นนี้'),
        (r'เช่น นั้น', 'เช่นนั้น'),
        (r'อย่าง นี้', 'อย่างนี้'),
        (r'อย่าง นั้น', 'อย่างนั้น'),
        (r'เกี่ยว กับ', 'เกี่ยวกับ'),
        (r'โดย เฉพาะ', 'โดยเฉพาะ'),
        (r'ตาม ที่', 'ตามที่'),
        (r'ตาม ด้วย', 'ตามด้วย'),
        (r'เพื่อ ที่', 'เพื่อที่'),
        (r'เพื่อ ไม่', 'เพื่อไม่'),
        (r'ทำ ให้', 'ทำให้'),
        (r'ทำ ให้', 'ทำให้'),
        (r'ถูก ทำ', 'ถูกทำ'),
        (r'ถูก ใช้', 'ถูกใช้'),
        (r'ถูก รับ', 'ถูกรับ'),
        (r'ถูก โจมตี', 'ถูกโจมตี'),
        (r'ถูก ลบ', 'ถูกลบ'),
        (r'ถูก เพิ่ม', 'ถูกเพิ่ม'),
        (r'ถูก ลด', 'ถูกลด'),
        (r'ถูก ทำลาย', 'ถูกทำลาย'),
        (r'ถูก ฆ่า', 'ถูกฆ่า'),
        (r'ถูก ฮีล', 'ถูกฮีล'),
        (r'ถูก รักษา', 'ถูกรักษา'),
        (r'ถูก ปล่อย', 'ถูกปล่อย'),
        (r'ถูก เรียก', 'ถูกเรียก'),
        (r'ถูก สร้าง', 'ถูกสร้าง'),
        (r'ถูก ทำให้', 'ถูกทำให้'),
        (r'ให้ เป็น', 'ให้เป็น'),
        (r'ให้ ได้', 'ให้ได้'),
        (r'ให้ ทำ', 'ให้ทำ'),
        (r'ให้ ใช้', 'ให้ใช้'),
        (r'ให้ รับ', 'ให้รับ'),
        (r'ให้ โจมตี', 'ให้โจมตี'),
        (r'ให้ ลบ', 'ให้ลบ'),
        (r'ให้ เพิ่ม', 'ให้เพิ่ม'),
        (r'ให้ ลด', 'ให้ลด'),
        (r'ให้ ทำลาย', 'ให้ทำลาย'),
        (r'ให้ ฆ่า', 'ให้ฆ่า'),
        (r'ให้ ฮีล', 'ให้ฮีล'),
        (r'ให้ รักษา', 'ให้รักษา'),
        (r'ให้ ปล่อย', 'ให้ปล่อย'),
        (r'ให้ เรียก', 'ให้เรียก'),
        (r'ให้ สร้าง', 'ให้สร้าง'),
        (r'ให้ ทำให้', 'ให้ทำให้'),
        (r'ให้ เป็น', 'ให้เป็น'),
        (r'ให้ ได้', 'ให้ได้'),
        (r'ให้ ทำ', 'ให้ทำ'),
        (r'ให้ ใช้', 'ให้ใช้'),
        (r'ให้ รับ', 'ให้รับ'),
        (r'ให้ โจมตี', 'ให้โจมตี'),
        (r'ให้ ลบ', 'ให้ลบ'),
        (r'ให้ เพิ่ม', 'ให้เพิ่ม'),
        (r'ให้ ลด', 'ให้ลด'),
        (r'ให้ ทำลาย', 'ให้ทำลาย'),
        (r'ให้ ฆ่า', 'ให้ฆ่า'),
        (r'ให้ ฮีล', 'ให้ฮีล'),
        (r'ให้ รักษา', 'ให้รักษา'),
        (r'ให้ ปล่อย', 'ให้ปล่อย'),
        (r'ให้ เรียก', 'ให้เรียก'),
        (r'ให้ สร้าง', 'ให้สร้าง'),
        (r'ให้ ทำให้', 'ให้ทำให้'),
    ]

    for old, new in compound_fixes:
        t = re.sub(old, new, t)

    # ===================
    # PHASE 3: Fix specific common phrases
    # ===================

    # Fix "เข้า" + "สู่" pattern
    t = re.sub(r'เข้า\s+สู่', 'เข้าสู่', t)

    # Fix "ไม่" + word patterns
    t = re.sub(r'ไม่\s+longer', 'ไม่ ', t)
    t = re.sub(r'ไม่\s+มี', 'ไม่มี', t)
    t = re.sub(r'ไม่\s+สามารถ', 'ไม่สามารถ', t)
    t = re.sub(r'ไม่\s+ได้', 'ไม่ได้', t)

    # Fix "เมื่อ" patterns
    t = re.sub(r'เมื่อ\s+ไหร่', 'เมื่อ', t)
    t = re.sub(r'เมื่อ\s+ที่', 'เมื่อ', t)

    # Fix "แล้ว" patterns
    t = re.sub(r'แล้ว\s+ไป', 'แล้วไป', t)
    t = re.sub(r'แล้ว\s+มา', 'แล้วมา', t)
    t = re.sub(r'แล้ว\s+กลับ', 'แล้วกลับ', t)

    # Fix "หลัง" patterns
    t = re.sub(r'หลัง\s+จาก', 'หลังจาก', t)
    t = re.sub(r'หลัง\s+นั้น', 'หลังจากนั้น', t)
    t = re.sub(r'หลัง\s+ที่', 'หลังที่', t)

    # Fix "ก่อน" patterns
    t = re.sub(r'ก่อน\s+ที่จะ', 'ก่อนที่จะ', t)
    t = re.sub(r'ก่อน\s+นั้น', 'ก่อนนั้น', t)
    t = re.sub(r'ก่อน\s+ที่', 'ก่อนที่', t)

    # Fix "ขณะ" patterns
    t = re.sub(r'ขณะ\s+ที่', 'ขณะ', t)
    t = re.sub(r'ขณะ\s+ใช้', 'ขณะใช้', t)
    t = re.sub(r'ขณะ\s+ทำงาน', 'ขณะทำงาน', t)

    # Fix "เพราะ" patterns
    t = re.sub(r'เพราะ\s+ว่า', 'เพราะว่า', t)

    # Fix "ดังนั้น" patterns
    t = re.sub(r'ดัง\s+นั้น', 'ดังนั้น', t)

    # Fix "แม้" patterns
    t = re.sub(r'แม้\s+ว่า', 'แม้ว่า', t)

    # Fix "อย่างไร" patterns
    t = re.sub(r'อย่าง\s+ไรก็', 'อย่างไรก็', t)

    # Fix "ถ้า" patterns
    t = re.sub(r'ถ้า\s+เป็น', 'ถ้าเป็น', t)
    t = re.sub(r'ถ้า\s+ไม่', 'ถ้าไม่', t)

    # Fix "เมื่อ" + verb
    t = re.sub(r'เมื่อ\s+โดน', 'เมื่อถูกโจมตี', t)
    t = re.sub(r'เมื่อ\s+ถูก', 'เมื่อถูก', t)
    t = re.sub(r'เมื่อ\s+รับ', 'เมื่อรับ', t)
    t = re.sub(r'เมื่อ\s+ได้รับ', 'เมื่อได้รับ', t)

    # Fix "ทุก" + number + time
    t = re.sub(r'ทุก\s+(\d+)s', r'\1 วินาที', t)
    t = re.sub(r'ทุก\s+(\d+)\s+s', r'\1 วินาที', t)

    # Fix "for Xs" to "Xs"
    t = re.sub(r'for\s+(\d+)s', r'\1 วินาที', t)
    t = re.sub(r'for\s+(\d+)\s+s', r'\1 วินาที', t)

    # Fix "per second" patterns
    t = re.sub(r'per\s+second', 'ต่อวินาที', t)
    t = re.sub(r'per\s+sec', 'ต่อวินาที', t)

    # ===================
    # PHASE 4: Final cleanup
    # ===================

    # Remove extra spaces again
    t = re.sub(r' +', ' ', t)
    t = re.sub(r' +', ' ', t)  # twice for safety

    # Remove trailing spaces
    t = t.strip()

    # Remove double punctuation
    t = re.sub(r'\.\.+', '.', t)
    t = re.sub(r',+', ',', t)

    return t


def fix_fellow(fellow):
    """Fix all text fields in a fellow entry."""
    fields = ['leaderSkill', 'basicAttack', 'skill1', 'skill2', 'skill3', 'awakenSkill']

    for field in fields:
        if field in fellow and fellow[field]:
            fellow[field] = fix_text(fellow[field])

    # Fix tierlist notes
    if 'tierlist' in fellow and fellow['tierlist']:
        tierlist = fellow['tierlist']
        if 'notes' in tierlist and tierlist['notes']:
            tierlist['notes'] = fix_text(tierlist['notes'])

    return fellow


def main():
    input_file = 'content/tos-m/fellows-db.json'
    output_file = 'content/tos-m/fellows-db.json'

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for fellow in data:
        fix_fellow(fellow)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Fixed {len(data)} fellows")


if __name__ == '__main__':
    main()
