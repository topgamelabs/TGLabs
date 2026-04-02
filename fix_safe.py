#!/usr/bin/env python3
"""
Safe Thai translation fixer for fellows-db.json.
Only applies very targeted fixes without risking breaking existing spacing.
"""

import json
import re

def fix_text(text):
    """Apply only safe, targeted Thai translation fixes."""
    if not text or not isinstance(text, str):
        return text

    # Don't touch empty or simple placeholder strings
    if text.strip() in ['ไม่มี', '', 'ไม่']:
        return text

    # Skip if mostly English (>70% English characters)
    english_chars = len(re.findall(r'[a-z-Z]', text))
    total_chars = len(text.replace(' ', ''))
    if total_chars > 0 and english_chars / total_chars > 0.70:
        # Mostly English - clean up only double spaces
        return re.sub(r' +', ' ', text).strip()

    t = text

    # Remove double spaces (harmless cleanup)
    t = re.sub(r'  +', ' ', t)

    # Remove spaces before punctuation
    t = re.sub(r' +([,\.])', r'\1', t)

    # Fix "ทุก 0 . 5s" -> "ทุก 0.5s" (remove space in decimal numbers)
    t = re.sub(r'(\d+)\. (\d+[sm]?)', r'\1.\2', t)

    # Fix "ทุก 0 . 3s" -> "ทุก 0.3s" etc
    t = re.sub(r'(\d)\. (\d)', r'\1.\2', t)

    # Fix common broken patterns
    # "ไม่ มี" -> "ไม่มี"
    t = re.sub(r'ไม่ มี', 'ไม่มี', t)

    # "จาก นั้น" -> "จากนั้น"
    t = re.sub(r'จาก นั้น', 'จากนั้น', t)

    # "หลัง จาก" -> "หลังจาก"
    t = re.sub(r'หลัง จาก', 'หลังจาก', t)

    # "เข้า สู่" -> "เข้าสู่"
    t = re.sub(r'เข้า สู่', 'เข้าสู่', t)

    # "เมื่อ ไหร่" -> "เมื่อไหร่"
    t = re.sub(r'เมื่อ ไหร่', 'เมื่อไหร่', t)

    # "แต่ ละ" -> "แต่ละ"
    t = re.sub(r'แต่ ละ', 'แต่ละ', t)

    # "เป้า หมาย" -> "เป้าหมาย"
    t = re.sub(r'เป้า หมาย', 'เป้าหมาย', t)

    # "พื้น ที่" -> "พื้นที่"
    t = re.sub(r'พื้น ที่', 'พื้นที่', t)

    # "ความ เร็ว" -> "ความเร็ว"
    t = re.sub(r'ความ เร็ว', 'ความเร็ว', t)

    # "ความ เสียหาย" -> "ความเสียหาย"
    t = re.sub(r'ความ เสียหาย', 'ความเสียหาย', t)

    # "ระยะ เวลา" -> "ระยะเวลา"
    t = re.sub(r'ระยะ เวลา', 'ระยะเวลา', t)

    # "ทิศ ทาง" -> "ทิศทาง"
    t = re.sub(r'ทิศ ทาง', 'ทิศทาง', t)

    # "ด้าน หลัง" -> "ด้านหลัง"
    t = re.sub(r'ด้าน หลัง', 'ด้านหลัง', t)

    # "ไม่ สามารถ" -> "ไม่สามารถ"
    t = re.sub(r'ไม่ สามารถ', 'ไม่สามารถ', t)

    # "ไม่ ได้" -> "ไม่ได้"
    t = re.sub(r'ไม่ ได้', 'ไม่ได้', t)

    # "ได้ รับ" -> "ได้รับ"
    t = re.sub(r'ได้ รับ', 'ได้รับ', t)

    # "ให้ กับ" -> "ให้กับ"
    t = re.sub(r'ให้ กับ', 'ให้กับ', t)

    # "ลด ความ" -> "ลดความ"
    t = re.sub(r'ลด ความ', 'ลดความ', t)

    # "เพิ่ม ความ" -> "เพิ่มความ"
    t = re.sub(r'เพิ่ม ความ', 'เพิ่มความ', t)

    # "เป็น เวลา" -> "เป็นเวลา"
    t = re.sub(r'เป็น เวลา', 'เป็นเวลา', t)

    # "อยู่ ใน" -> "อยู่ใน"
    t = re.sub(r'อยู่ ใน', 'อยู่ใน', t)

    # "พร้อม กับ" -> "พร้อมกับ"
    t = re.sub(r'พร้อม กับ', 'พร้อมกับ', t)

    # "โดย ไม่" -> "โดยไม่"
    t = re.sub(r'โดย ไม่', 'โดยไม่', t)

    # "ทั้ง หมด" -> "ทั้งหมด"
    t = re.sub(r'ทั้ง หมด', 'ทั้งหมด', t)

    # "ตัว เอง" -> "ตัวเอง"
    t = re.sub(r'ตัว เอง', 'ตัวเอง', t)

    # "ใช้ งาน" -> "ใช้งาน"
    t = re.sub(r'ใช้ งาน', 'ใช้งาน', t)

    # "ทำ งาน" -> "ทำงาน"
    t = re.sub(r'ทำ งาน', 'ทำงาน', t)

    # "ขณะ ใช้" -> "ขณะใช้"
    t = re.sub(r'ขณะ ใช้', 'ขณะใช้', t)

    # "ขณะ ทำงาน" -> "ขณะทำงาน"
    t = re.sub(r'ขณะ ทำงาน', 'ขณะทำงาน', t)

    # Remove spaces between number and unit like "0 . 5s" -> "0.5s"
    t = re.sub(r'(\d) \. (\d)', r'\1.\2', t)

    # Final double space cleanup
    t = re.sub(r'  +', ' ', t)
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
