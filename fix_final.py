#!/usr/bin/env python3
"""Final Thai translation fixer - targeted fixes only, no over-aggressive patterns."""

import json
import re

def fix_text(text):
    """Fix Thai translation patterns without breaking existing formatting."""
    if not text or not isinstance(text, str):
        return text

    # Don't touch empty or simple strings
    if text.strip() in ['ไม่มี', '', 'ไม่']:
        return text

    # Skip if mostly English (>65% English characters)
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total_chars = len(text.replace(' ', ''))
    if total_chars > 0 and english_chars / total_chars > 0.65:
        return re.sub(r' +', ' ', text).strip()

    t = text

    # Remove double spaces
    t = re.sub(r' +', ' ', t)

    # Fix common spacing issues with punctuation
    t = re.sub(r' +([,\.])', r'\1', t)

    # Fix "ไป" before verbs (common translation error)
    verbs = ['ยิง', 'โจมตี', 'สร้างความเสียหาย', 'ให้', 'วาง', 'เรียก',
             'รักษา', 'ฟื้นฟู', 'ปล่อย', 'เพิ่ม', 'ลด', 'ทำ', 'ใช้',
             'รอ', 'มา', 'ไป', 'ลง', 'ขึ้น', 'พุ่ง', 'ฟาด', 'ทุบ', 'ซัด']
    for v in verbs:
        t = re.sub(rf'{v} ไป ', rf'{v} ', t)

    # Fix "นั้น" after action words
    actions = ['โจมตี', 'สร้างความเสียหาย', 'ยิง', 'ให้', 'วาง', 'เรียก',
               'รักษา', 'ฟื้นฟู', 'ปล่อย', 'เคลื่อน', 'กระโดด', 'พุ่ง',
               'ฟาด', 'ทุบ', 'ซัด', 'หมุน', 'แทง', 'ฟื้น', 'สร้าง', 'เรียก']
    for a in actions:
        t = re.sub(rf'{a} นั้น ', rf'{a} ', t)

    # Fix "ของ" separation
    t = re.sub(r'ของ นี้', 'ของตัวเอง', t)
    t = re.sub(r'ของ ตัวเอง', 'ของตัวเอง', t)
    t = re.sub(r'ของ เขา', 'ของเขา', t)
    t = re.sub(r'ของ เธอ', 'ของเธอ', t)
    t = re.sub(r'ของ มัน', 'ของมัน', t)
    t = re.sub(r'ของ คุณ', 'ของคุณ', t)

    # Fix "ด้วย" issues
    t = re.sub(r'ด้วย นี้', 'ด้วยตัวเอง', t)
    t = re.sub(r'ด้วย ตัวเอง', 'ด้วยตัวเอง', t)

    # Fix "เมื่อไหร่" -> "เมื่อ"
    t = re.sub(r'เมื่อไหร่ ', 'เมื่อ ', t)

    # Fix "ให้" duplication
    t = re.sub(r'ให้ ให้', 'ให้', t)

    # Fix specific useful Thai compound fixes
    # Only ones that are SAFE and definitely improve readability
    safe_fixes = [
        # Time expressions - convert English to Thai
        (r'per second', 'ต่อวินาที'),
        (r'per sec', 'ต่อวินาที'),
        (r'for (\d+)s', r'\1 วินาที'),
        (r'สำหรับ (\d+)s', r'\1 วินาที'),
        (r'ทุก 0\. 5s', 'ทุก 0.5 วินาที'),
        (r'ทุก (\d+) ที่สอง', r'ทุก \1 วินาที'),
        (r'ทุก 2 ที่สอง', 'ทุก 2 วินาที'),

        # Common word pairs that improve readability
        (r'จาก นั้น', 'จากนั้น'),
        (r'หลัง จาก', 'หลังจาก'),
        (r'เข้า สู่', 'เข้าสู่'),
        (r'เมื่อ ไหร่', 'เมื่อไหร่'),
        (r'แต่ ละ', 'แต่ละ'),
        (r'เป้า หมาย', 'เป้าหมาย'),
        (r'พื้น ที่', 'พื้นที่'),
        (r'ความ เร็ว', 'ความเร็ว'),
        (r'ความ เสียหาย', 'ความเสียหาย'),
        (r'ระยะ เวลา', 'ระยะเวลา'),
        (r'ทิศ ทาง', 'ทิศทาง'),
        (r'ด้าน หลัง', 'ด้านหลัง'),
        (r'ไม่ มี', 'ไม่มี'),
        (r'ทั้ง หมด', 'ทั้งหมด'),
        (r'ตัว เอง', 'ตัวเอง'),
        (r'ไม่ สามารถ', 'ไม่สามารถ'),
        (r'ไม่ ได้', 'ไม่ได้'),
        (r'ได้ รับ', 'ได้รับ'),
        (r'ให้ กับ', 'ให้กับ'),
        (r'ลด ความ', 'ลดความ'),
        (r'เพิ่ม ความ', 'เพิ่มความ'),
        (r'เป็น เวลา', 'เป็นเวลา'),
        (r'อยู่ ใน', 'อยู่ใน'),
        (r'พร้อม กับ', 'พร้อมกับ'),
        (r'โดย ไม่', 'โดยไม่'),
        (r'ขณะ ใช้', 'ขณะใช้'),
        (r'ขณะ ทำงาน', 'ขณะทำงาน'),
    ]

    for old, new in safe_fixes:
        t = re.sub(old, new, t)

    # Final cleanup
    t = re.sub(r' +', ' ', t)
    t = t.strip()

    return t


def fix_fellow(fellow):
    fields = ['leaderSkill', 'basicAttack', 'skill1', 'skill2', 'skill3', 'awakenSkill']
    for field in fields:
        if field in fellow and fellow[field]:
            fellow[field] = fix_text(fellow[field])

    if 'tierlist' in fellow and fellow['tierlist']:
        tierlist = fellow['tierlist']
        if 'notes' in tierlist and tierlist['notes']:
            tierlist['notes'] = fix_text(tierlist['notes'])

    return fellow


def main():
    with open('content/tos-m/fellows-db.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for fellow in data:
        fix_fellow(fellow)

    with open('content/tos-m/fellows-db.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Fixed {len(data)} fellows")


if __name__ == '__main__':
    main()
