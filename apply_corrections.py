#!/usr/bin/env python3
"""Apply targeted Thai corrections for key fellows."""

import json

CORRECTIONS = {
    # === DEMIGOD UR FELLOWS ===

    # Inferno Zaura
    "Inferno Zaura|skill1": "Sunder Flare CD 15s ทุบพื้นด้านขวา สร้างพื้นที่เพลิงบนพื้นเป็นเวลา 5s สร้างความเสียหาย 141% ทุก 0.5s ลด damage taken 50% ขณะใช้สกิล",
    "Inferno Zaura|skill2": "Chariot of Fire CD 12s กระโดดขึ้นฟ้าแล้วหมุนอย่างรวดเร็วด้วยขวางโจมตี สร้างความเสียหาย 413% ทุก 0.25s จากนั้นลงมาโจมตีทุบพื้นสร้างความเสียหายเท่ากันใน AoE กว้างขึ้น ลด damage taken 50% ขณะใช้สกิล",
    "Inferno Zaura|skill3": "Whirlwind of Flame CD 20s หมุนอย่างรวดเร็วด้วยขวางสร้างเพลิงหมุนคลุ้มไปรอบๆ สร้างความเสียหาย 201% ทุก 0.5s ต่อเนื่องไปยังศัตรูในพื้นที่ ลด damage taken 50% ขณะใช้สกิล",
    "Inferno Zaura|awakenSkill": "Warcry Explosion [Unlock ที่ rank 1] CD 120s ปลดปล่อยความโกรธรอบตัว สร้างความเสียหาย 740% และทำให้ fellow นี้เข้าสู่สถานะ Awakening เป็นเวลา 30s [Awakening] Knockback immune, โจมตีความเร็ว +50%, พื้นฐานโจมตี damage +300%, skill โจมตี damage +200%",
    "Inferno Zaura|tierlist_notes": "ไม่ใช่ตัวเด็ดดันในยุคนี้แล้ว แต่ยังดีสำหรับ frontline ใน PvP และดี 50% dmg amp vs ศัตรู Earth และ Holy พร้อม imbue effect ช่วยลดความยากในการ gear",

    # Little Star Candy Vakarine
    "Little Star Candy Vakarine|skill1": "Help Me! Dionys! CD 15s โจมตีเป้าหมายในพื้นที่ด้วยตุ๊กตาของ Dionys สร้างความเสียหาย 3 ครั้ง รวม 1676%",
    "Little Star Candy Vakarine|skill2": "Sugar Crystal CD 20s เรียก Sugar Crystal แล้วยิงลูกแก้วคริสตัลทุก 2s สูงสุด 6 ครั้ง แต่ละลูกแก้วสร้างความเสียหาย 165% และให้ Sticky เมื่อโดนเป้าหมายเป็นเวลา 3s [Sticky] Movement ความเร็ว -10%, Atk -2% ทั้งสอง effect สามารถ stack ได้ โดย Atk down เท่านั้นที่ damage ใช้กับผู้เล่นและ fellows ของคุณ",
    "Little Star Candy Vakarine|skill3": "ดาววงกลม CD 15s เรียกวงกลมเวทย์มนตร์ดาวที่ตำแหน่งศัตรู สร้างความเสียหาย 1117% และ Stun ศัตรู หลังจากนั้น วงกลมเวทย์มนตร์คงอยู่ 10s สร้างความเสียหาย 223% ต่อวินาทีไปยังศัตรูในพื้นที่ พร้อมให้ผู้เล่นและ fellow โจมตีความเร็ว +15% และ movement ความเร็ว +15% ในพื้นที่นั้น",
    "Little Star Candy Vakarine|awakenSkill": "Fantastic Show [Unlock ที่ rank 1] CD 120s Stun ศัตรูทั้งหมดรอบตัว และเข้าสู่สถานะ Awakening 30s ปล่อยเต้นรำบนพื้นรอบตัวเป็นเวลา 10s สร้างความเสียหาย 511% ทุก 2s ลด Hit Rate และ Penetration Rate ของศัตรูที่โดน 10% เป็นเวลา 3s [Awakening] Skill damage และ DoT damage เพิ่ม 200% ฟื้นฟู 7.5% HP ทุก 5 วินาที",
    "Little Star Candy Vakarine|tierlist_notes": "รอบรับทุกอย่าง - ฮีลได้ AoE สำหรับปั้น alt และดี buff แต่ downtime ต่ำเมื่อเทียบกับตัวใหม่ที่เข้ามาในทีม ยังใช้ได้และเป็นตัวเลือกที่สบายสำหรับหลายคน",

    # Revenger Hauberk
    "Revenger Hauberk|skill1": "Lionheart CD 10s โจมตีพื้นที่ด้านหน้าฟาดพื้นด้วยหมัด สร้างความเสียหาย 3 ครั้ง รวม 1706% และรวบรวมศัตรูไปยังใจกลางพื้นที่โจมตี ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย",
    "Revenger Hauberk|skill2": "Scratch CD 10s โจมตีพื้นที่ด้านหน้าฟันไปข้างหน้าด้วยกรงเล็บทั้งสอง สร้างความเสียหาย 436% x 2 จากนั้นปิดท้ายด้วย shockwave ไปข้างหน้าสร้างความเสียหาย 872% ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย",
    "Revenger Hauberk|skill3": "Venge of Souls CD 20s โจมตีต่อเนื่องด้วยกรงเล็บ สร้างความเสียหาย 427% x 7 ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย",
    "Revenger Hauberk|awakenSkill": "Trauma สลับ [Unlock ที่ rank 1] CD 120s สลับรูปแบบเป็น Dark รูปแบบ เข้าสู่สถานะ Awakening 30s ขณะสถานะนี้จะปล่อย Dark aura รอบตัว สร้างความเสียหาย 410% ต่อวินาที [Awakening] ทุก damage เพิ่ม 75% พื้นฐานโจมตีมี 35% โอกาสสร้าง shockwave เพิ่มเติม",
    "Revenger Hauberk|tierlist_notes": "จุดดีเดียวของเขาคือ HP/SP regen จาก rank 5 และเขายังมีข้อจำกัดจากการตายบ่อยเกินไป เฉพาะ Cleric Class เท่านั้นที่พอรับเขาได้",

    # Champion Gabija
    "Champion Gabija|skill1": "Flame Knee Kick CD 15s ส้ำพื้นเพื่อกระโดดไปหาศัตรูแล้วเตะด้วยเข่า สร้างความเสียหาย 1778% Fire AoE damage 25% โอกาสทำให้ศัตรู stumble ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย",
    "Champion Gabija|skill2": "Pummel Kick CD 15s เตะอย่างรวดเร็วไปข้างหน้า สร้างความเสียหาย 247% x 10 ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย [Additional Effect] ใช้สกิลนี้ขณะ awakened มีโอกาสใช้ extra ครั้งทันทีโดยไม่ต้อง cooldown",
    "Champion Gabija|skill3": "Flame Wheelwind Kick CD 15s หมุนรอบขณะเตะศัตรูทั้งหมดรอบตัว สร้างความเสียหาย 5 ครั้ง รวม 1117% จากนั้นปล่อย phoenix บินไปข้างหน้า สร้างความเสียหาย 558% ทุก 0.5s ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย [Additional Effect] ศัตรูที่โดน phoenix จะถูก Burn 10s โดยรับ 279% ความเสียหายต่อวินาที และเพิ่ม damage ที่รับ 15%",
    "Champion Gabija|awakenSkill": "Faceoff [Unlock ที่ rank 1] CD 120s รวบรวมพลังไฟไปที่เท้าแล้วส้ำพื้น สร้างความเสียหาย 874% และเข้าสู่สถานะ Awakening 30s พร้อมสร้างพื้นที่ Faceoff ที่ตัวเอง [Awakening] เพิ่ม damage 150% ขณะอยู่ในพื้นที่ Faceoff เพิ่ม Max HP ของตัวนี้และ master 70% (ไม่รวมฮีลจากการเพิ่ม HP) และเพิ่มโจมตี 30% พร้อมฮีล 200% ของ block value ของตัวนี้ทุก 2s",
    "Champion Gabija|tierlist_notes": "Awakening ของเธอแรงมากแม้จะเป็น effect พื้นที่ ทำให้เธอมีประโยชน์แม้แค่ rank 1 ไม่ดีเท่าตัวอื่นสำหรับ damage boost แต่เป็นตัวเลือกที่ดีสำหรับมือใหม่ที่ชอบเล่น DPS class ที่ขาดความอึดอย่าง Archer, Scout และ Musketeer",

    # Gumiho Lada
    "Gumiho Lada|skill1": "Spark Burst CD 15s ปล่อยกระแสไฟฟ้าแรงสูงรอบตัว สร้างความเสียหาย 5 ครั้ง รวม 896% โจมตีนี้ให้ 1-3 stacks ของ Spark แก่แต่ละศัตรูที่โดนเป็นเวลา 20s [Spark] สร้างความเสียหาย 106% Lightning DoT stack ได้สูงสุด 20 stacks ตั้งแต่ stack 2 ขึ้นไปเพิ่ม damage นี้ 5%",
    "Gumiho Lada|skill2": "Charm CD 60s Charm ศัตรูทั้งหมดในพื้นที่ด้านหน้า ถ้าสำเร็จ Charmed ศัตรูจะทำอะไรไม่ได้ 2s จากนั้นลด movement ความเร็ว 25% และโจมตีความเร็ว 80% เป็นเวลา 5s [Additional Effect] Lada immune ต่อทุกโจมตีขณะใช้สกิลนี้ และได้รับ buff 10s หลังจากนั้นที่ทำให้ immune ต่อ knockback และลด damage taken 25%",
    "Gumiho Lada|skill3": "วิญญาณ Eater CD 15s โจมตีศัตรูทั้งหมดในรัศมี 1m สร้างความเสียหาย 938% ให้ตัวเอง 3 stacks ของ Absorption ต่อศัตรูที่โดน พร้อมให้ศัตรูที่โดนสถานะ Lethargy 10s",
    "Gumiho Lada|awakenSkill": "Night of Temptation [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s และเพิ่มระยะเวลา debuff ของศัตรูทั้งหมดรอบตัว 100% [Awakening] เพิ่ม debuff ระยะเวลาที่ลงเป็นศัตรู 100% ให้ buff Night Parade แก่ทุก fellows (ยกเว้น demigod fellows) เพิ่ม non-DoT damage 20% ทุกโจมตีมี 30% โอกาสให้ 1 Spark แก่ศัตรูที่โดน (สำหรับ fellow ที่มี buff Tail Blessing buff นี้จะอยู่ร่วมกับ Tail Blessing)",
    "Gumiho Lada|tierlist_notes": "ต้องมีสำหรับ Wizard class สกิล rank 7 ของเธอให้สถานะ Lethargy effect ที่เข้ากันดีกับ Earthquake ยังมีประโยชน์มากด้วย AoE CC, อึดเพราะมีชีวิตเพิ่มจาก effect rank 5 และเกือบถาวร 40% dmg amp",

    # Holy Knight Arlene
    "Holy Knight Arlene|skill1": "ศักดิ์สิทธิ์ Touch CD 15s ปล่อยแสงศักดิ์สิทธิ์ชำระล้างรอบตัว สร้างความเสียหาย 913% และลบ debuffs ทั้งหมดจาก allies ทั้งหมด ให้ตัวเอง stacks ของศักดิ์สิทธิ์ Knight เท่ากับจำนวน ally ที่ได้รับผลกระทบจากสกิลนี้ [ศักดิ์สิทธิ์ Knight] buff ถาวร ลด damage จาก boss และ Demigod ตัวละคร 1% ต่อ stack สูงสุด 45 stacks",
    "Holy Knight Arlene|skill2": "Purify วิญญาณ CD 20s ปล่อย purify aura ที่ขยายตัว 20% ทุกครั้งที่โจมตี สร้างความเสียหาย 284% x 5 ให้ตัวเอง stacks ของ Purifier [Purifier] buff ถาวร เพิ่ม natural HP recovery 0.15% ของ Max HP ต่อ stack สูงสุด 45 stacks (natural HP recovery ปกติคือ 3% Max HP ทุก 3s) [Purifier stack gain condition] โดน boss: ได้ 2 stacks โดน Demigod ตัวละคร: ได้ 1 stack ศัตรูอื่น: 10% โอกาสต่อ hit ได้ 1 stack",
    "Holy Knight Arlene|skill3": "Verdict CD 15s โจมตีศัตรูในพิสัยสุ่ม 6 ครั้ง (เป้าหมาย boss หรือ demigod ตัวละครก่อนถ้าเป็นไปได้) แต่ละ hit สร้างความเสียหาย 286% ให้ตัวเอง 5 stacks ของ Slayer [Slayer] buff ถาวร เพิ่ม damage ต่อ boss และ Demigod ตัวละคร 4% ต่อ stack สูงสุด 45 stacks",
    "Holy Knight Arlene|awakenSkill": "Trinity [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s และให้ 5 stacks ของศักดิ์สิทธิ์ Knight, Purifier และ Slayer [Awakening] Knockback Immune ทุกโจมตีสร้างความเสียหายเพิ่มเติม 1.5% ของ Max HP ของศัตรู (damage จาก Max HP จำกัดที่ 20% ของโจมตี power ของตัวนี้) เมื่อถูกโจมตีโดย boss หรือ demigod ตัวละคร ลด cooldown ของสกิลนี้ 10s",
    "Holy Knight Arlene|tierlist_notes": "unit ที่มีประโยชน์มากแต่น่าเศร้าที่ถูก powercrept โดย Velcoffer ให้ sustanable ฮีล, 50% dmg boost ที่เป็น multiplicative และ guarantee block ที่ลด damage ได้ดี แต่ damage ของเธอไม่ดีโดยไม่มี rings ทำให้เธอต้องลงทุนสูง",

    # Sweet Gothic Nebulas
    "Sweet Gothic Nebulas|skill1": "Ghastly ผี CD 8s ยิง 6 Ghastly ผี missile ไปโจมตีศัตรู แต่ละ ผี สร้างความเสียหาย 312% [Additional Effect] ถ้าเป็นไปได้ ใช้ 0-4 ผี stacks เพื่อยิง Ghastly ผี missile เพิ่มเติม",
    "Sweet Gothic Nebulas|skill2": "Sad ผี CD 30s เป็นเวลา 30s ทุก 5s จะเรียกผีเศร้ามาหลอกศัตรู สร้างความเสียหาย 370% และให้ debuff Nervous Struggle 10s เพิ่ม damage ที่รับจาก master และทุก fellows 15% [Additional Effect] ทุกครั้งที่ผีเศร้าโจมตี ใช้ 0-2 ผี stacks เพื่อเพิ่มระยะเวลา Nervous Struggle 5s ต่อ stack ที่ใช้",
    "Sweet Gothic Nebulas|skill3": "Gothic ผี CD 15s เป็นเวลา 10s เพิ่ม damage จาก Gothic ผี 50% [Additional Effect] ถ้าเป็นไปได้ ใช้ 0-5 ผี stacks เพื่อเรียก Enhanced Gothic ผี โจมตีศัตรูด้วย AoE กว้างขึ้น พร้อมให้ศัตรู Gothic ผี-Curse 5s (ทุกครั้งที่ศัตรูที่มี debuff พยายามใช้สกิล จะรับความเสียหาย 20% ถือว่าเป็น Curse)",
    "Sweet Gothic Nebulas|awakenSkill": "ผี Revolution [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s [Awakening] - ทุก 2s เรียก 1 Gothic ผี และให้ debuff Laziness แก่ศัตรูทั้งหมดรอบตัว 10s ลดโจมตี, hit Rate และ penetration Rate 10% - ใช้สกิลใดๆ ให้ 30 ผี stacks - เพิ่มโจมตีตัวนี้ 1% ต่อ ผี stack ที่มี",
    "Sweet Gothic Nebulas|tierlist_notes": "สร้างความเสียหายได้มากในฐานะ DPS ตัวละคร ranged และให้ passive 20% atk และ HP boost ที่ถือว่ามากมายใน lategame ที่ทุกจุดโจมตีมีความสำคัญ แต่ถือว่าใช้ได้หลัง unlock rank 6 ทำให้เธอต้องลงทุนสูง เธอก็ดีในฐานะ PvP unit เช่นกัน",

    # Milky Way Starlight Jurate
    "Milky Way Starlight Jurate|skill1": "Stella Nova CD 10s รวบรวม cosmic พลังเพื่อโจมตีพื้นที่เล็ก สร้างความเสียหาย 922% ศัตรูที่อยู่ใจกลางรับ damage มากขึ้น สูงสุด 50% เพิ่ม [Resonance Effect] ยังสร้าง Stella Nova เพื่อโจมตีพื้นที่รอบแต่ละ member ที่ได้รับผลกระทบ สร้างความเสียหายเท่ากัน",
    "Milky Way Starlight Jurate|skill2": "Gleaming เบา CD 10s ย่อ Milky Way Galaxy เป็นเส้นบางๆ แล้วยิงไปข้างหน้า สร้างความเสียหาย 942% ศัตรู Fire-Element ที่โดนสกิลนี้จะถูกให้ debuff Frostbite 7.5s ลด damage 25% [Resonance Effect] ยังยิงลำแสงจากแต่ละ member ที่ได้รับผลกระทบ สร้างความเสียหายเท่ากันและ debuff เดียวกัน",
    "Milky Way Starlight Jurate|skill3": "Starlight Shower CD 10s เรียก shower ของแสงดาวมาประชุมพื้นที่ แสงดาวใหญ่จะเป้าหมายศัตรูแบบสุ่ม โจมตีศัตรูทั้งหมดในรัศมี 3m สร้างความเสียหาย 2004% หลังจากนั้น แสงดาวขนาดกลาง 2 ดวงจะตามโจมตีด้วย 66% รัศมี (2m) สร้างความเสียหาย 835% จากนั้น แสงดาวขนาดเล็ก 4 ดวงโจมตีในรัศมี 1.5m สร้างความเสียหาย 334% ในที่สุด แสงดาวขนาดเล็กมาก 8 ดวงโจมตีในรัศมี 1m สร้างความเสียหาย 167% [Resonance Effect] เพิ่ม 1 แสงดาวใหญ่ต่อแต่ละ member ที่ได้รับผลกระทบ",
    "Milky Way Starlight Jurate|awakenSkill": "Storm Flood [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s [Awakening - Storm Flood] - เพิ่มโจมตี 75% - ทุก 5s ให้ debuff Storm แก่ศัตรูสุ่ม 2 ตัว 7s (เป้าหมายศัตรูที่ยังไม่มี debuff ก่อน) - ศัตรูในสถานะ Storm รับ 86% ความเสียหายทุก 0.5 วินาทีในรัศมี 3m",
    "Milky Way Starlight Jurate|tierlist_notes": "SS God of Water แรงมากเมื่อเจอศัตรู Fire ใดๆ แต่ก็แค่นั้นและกับทุกอย่างอื่น เธอทำ damage ดีหลัง unlock rank 5-6 ขณะให้ mitigation จาก rank 4 ทำให้เธอค่อนข้าง versatile แม้ไม่ได้เจอศัตรู Fire",

    # Iron Fan Marnox
    "Iron Fan Marnox|skill1": "Swift ฟาด CD 5s เข้าหาศัตรูอย่างรวดเร็วแล้วฟาด สร้างความเสียหาย 2 ครั้ง รวม 1982% ยิ่งโจมตีความเร็วสูง ยิ่ง cast ความเร็วของสกิลนี้สูงขึ้นด้วย",
    "Iron Fan Marnox|skill2": "เต็ม Swing CD 15s โจมตีศัตรูรอบตัวด้วยพัดลม สร้างความเสียหาย 4 ครั้ง รวม 4878% damage นี้ damage กระจายในหมู่ศัตรู",
    "Iron Fan Marnox|skill3": "Iron Fan CD 30s วางพัดเหล็กมหึมาลงเพื่อกับดักศัตรูภายใน สร้างความเสียหาย 991% พัดคงอยู่ 10s ศัตรูในพื้นที่จะถูกลด hit Rate 20% และ movement ความเร็วลดมากขึ้นเมื่อใกล้ใจกลาง",
    "Iron Fan Marnox|awakenSkill": "Typhoon [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s [Awakening - Typhoon] - เพิ่มโจมตี 30% และโจมตีความเร็ว 75% - ทุก 5s สุ่มสร้าง Typhoon 1 ตัวใกล้ศัตรูที่พุ่งศัตรูขึ้นฟ้า Stun พวกเขา 2s",
    "Iron Fan Marnox|tierlist_notes": "PvP unit ที่เพิ่มเติมเป็น specialist vs ศัตรู Lightning ยิ่งถ้าศัตรูเป็นแมลงหรือสัตว์ร้าย-type ด้วย evasion Rate สูงจาก rings เขาสามารถเป็น tank ได้ด้วย ยั่วยุ hit มากจาก boss",

    # Amberscale Velcoffer
    "Amberscale Velcoffer|skill1": "Hush Veil CD 45s ห่อหุ้มตัวเองภายในปีกใหญ่ 10s ขณะรวบรวมพลัง Immune ต่อ debuffs ทั้งหมดของศัตรูที่โจมตีเธอมี 50% โอกาสถูก Petrified หลังระยะเวลาสิ้นสุด explode ในพื้นที่ใหญ่รอบตัว สร้างความเสียหาย 1817%",
    "Amberscale Velcoffer|skill2": "มังกร Scale CD 10s ขว้างเกล็ดร้อนไปข้างหน้า สร้างความเสียหาย 487% x 4 พร้อมให้ Burn และ Bleeding แก่ศัตรูเมื่อโดน",
    "Amberscale Velcoffer|skill3": "Ember Breath CD 10s กลับสู่รูปแบบมังกรครูหนึ่งครู แล้วหายใจออกเป็นพื้นที่ไปข้างหน้าด้วยพลังชีวิต สร้างความเสียหาย 926% แก่ศัตรู พร้อมฟื้นฟู 20% ของ HP ที่เสียแก่ทุก allies ในพื้นที่ [Additional Effect] ถ้า ally ที่มี 80% หรือมากกว่า HP อยู่ในพื้นที่ของ effect แทนที่จะฟื้นฟู พวกเขาจะได้รับ 5 stacks ของ buff Emberscale (สูงสุด 20 stacks) ทุกครั้งที่รับความเสียหาย 1 stack จะหายไปแล้วฟื้นฟู 1% ของ max HP (cooldown 1s)",
    "Amberscale Velcoffer|awakenSkill": "Phantom Velcoffer [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s [Awakening - Velcoffer] - เพิ่มโจมตีและ defense 50% ของรวม defense power ของ master และทุก fellows ใกล้เคียง (ไม่เกิน 300% ของ base defense) - ทุก 5s แปลงเป็นรูปแบบมังกรแล้วหายใจออกไปข้างหน้า สร้างความเสียหาย 374% x 3",
    "Amberscale Velcoffer|tierlist_notes": "75% damage amp จากตัวเองที่สามารถเพิ่มขึ้นเรื่อยๆ ตามเวลา รวมกับ 75% dmg amp debuff ทำให้ศักยภาพของเธอไม่มีใครเทียบได้ในตอนนี้ effect meteor จาก rank 2 พร้อมให้ damage ต่อเนื่องมาก และเธอก็มีฮีลที่สกิล rank 7 ทำให้เธอเป็น offensive support ที่ยอดเยี่ยมและเป็น bossing unit ที่ดีที่สุดในเกม",

    # Noble Giltine
    "Noble Giltine|skill1": "Dazzling Praise CD 10s ชำระพื้นที่รอบตัวด้วยพลังแสงสว่าง สร้างความเสียหาย 337% Holy damage ทุก 0.5s เป็นเวลา 5s [Additional Effect] ถ้า ศักดิ์สิทธิ์ Protection ทำงาน จะ cast Dazzling Praise พิเศษที่พื้นที่นั้น",
    "Noble Giltine|skill2": "ศักดิ์สิทธิ์ Protection CD 10s ชำระพื้นที่รอบด้วยพลังศักดิ์สิทธิ์ สร้างความเสียหาย 225% Holy damage ทุก 0.5s เป็นเวลา 5s แม้ออกจากพื้นที่แล้วจะถูกให้ Stigmata 5s สร้างความเสียหาย 225% Holy DoT damage ทุก 0.5s เป็นเวลา 2.5s ให้เจ้าของและทุก fellows Protection effect ขณะสกิลทำงานและคงอยู่อีก 2.5s หลังออกจากพื้นที่หรือหลังพื้นที่หายไป ชำระ mental-base debuffs ทั้งหมดและลด damage taken 20% [Additional Effect] ถ้า Dazzling Praise ทำงาน จะ cast ศักดิ์สิทธิ์ Protection พิเศษที่พื้นที่นั้น",
    "Noble Giltine|skill3": "Gift of ศักดิ์สิทธิ์ Tree CD 45s ให้ buff Gift แก่เจ้าของและทุก fellows 30s [Gift] - เพิ่มโจมตี 10% ของโจมตีของ Giltine - เพิ่ม damage dealt เท่ากับผลรวมของตัวเลือก 'เพิ่ม damage dealt ต่อ xx element ศัตรู' (สูงสุด 60%) - ลด damage taken เท่ากับผลรวมของตัวเลือก 'ลด damage taken จาก xx type ศัตรู' (สูงสุด 25%) buff Gift จะถูกลบเมื่อ Giltine ถูกลบออกจากทีม",
    "Noble Giltine|awakenSkill": "Primal Tranquillity [Unlock ที่ rank 1] CD 120s ชำระพื้นที่รอบด้วยพลังสงบ สร้างความเสียหาย 298% Holy damage ทุก 0.5s เป็นเวลา 5s และเข้าสู่สถานะ Awakening 30s ขณะนั้นให้ buff Tranquility แก่เจ้าของและทุก fellows ตามระยะเวลาเดียวกัน [Awakening - Giltine] - ลด damage taken จากปีศาจ-type ศัตรู 95% [Tranquility] Immune ต่อการตายครั้งเดียว เมื่อรับ lethal damage รอดชีวิตและฟื้นฟู 50% ของ Max HP และลบ buff นี้",
    "Noble Giltine|tierlist_notes": "AoE DPS ที่มาพร้อม support มากมาย แทนที่ Justina ในบทบาททีม res และสามารถสร้างความเสียหายดี & buff ในฐานะ unit meta ควรทำ สมัครสมาชิกมากในทุก content",

    # Night Prophet Laima
    "Night Prophet Laima|skill1": "Ring of เงา CD 30s เรียก ring มืดรอบตัว 5s สร้างความเสียหาย 777% ทุก 0.5s แก่ศัตรูที่แตะ ring และให้ debuff สุ่มแก่ศัตรูใกล้เคียง [Debuff List] - (30% โอกาส) ลด block และ evasion 16% 15s - (30% โอกาส) ลดโจมตี 33% 15s - (20% โอกาส) Stun 3s - (20% โอกาส) เพิ่ม damage ที่รับจากเจ้าของและทุก fellows 45% 15s เพิ่ม damage reduction aura 3s",
    "Night Prophet Laima|skill2": "Luna of Fate CD 30s สร้างจันทร์เสี้ยวแห่งโชคที่โคจรรอบตัว สร้างความเสียหาย 1454% ทุก 0.5s เป็นเวลา 5s แก่ศัตรูที่แตะมัน และให้ buff สุ่มแก่เจ้าของและทุก fellows [Buff List] - (40% โอกาส) เพิ่มโจมตี 38% 22s - (40% โอกาส) ลด damage taken 50% 22s - (20% โอกาส) ลดทุกสกิล cooldown 66% เพิ่ม damage reduction aura 3s",
    "Night Prophet Laima|skill3": "Cosmic Barrier CD 30s สร้าง 11 cosmic fragments ที่ลอยรอบตัว 15s แต่ละอันสร้างความเสียหาย 125% ต่อวินาทีแก่ศัตรูที่แตะมัน เมื่อเจ้าของรับความเสียหายมากกว่า 15% ของ Max HP ใช้ 1 fragment เพื่อดูดซับความเสียหายนั้น (fragment นั้นจะหายไป) เพิ่ม damage reduction aura 6s",
    "Night Prophet Laima|awakenSkill": "Fortune Signal [Unlock ที่ rank 1] CD 120s แผ่ความมืดรอบตัว เข้าสู่สถานะ Awakening 30s [Awakening - Laima] - เพิ่ม Max HP 70% และเพิ่มโจมตี 30% - debuff ศัตรูในพื้นที่มืด เพิ่ม damage ที่รับจากเจ้าของและทุก fellows 44% เพิ่ม damage reduction aura ระยะเวลา 10s",
    "Night Prophet Laima|tierlist_notes": "มี buffs & debuffs มากมายที่อาจดู RNG เกินไปตอนแรก แต่บรรเทาด้วย rank upgrade สำหรับความสม่ำเสมอมากขึ้น แต่จุดดีที่สุดของเธอคือเธอเพิ่มความอยู่รอดของคุณมากมาย ตัวเลือกที่ดีสำหรับ class ที่เปราะบางอย่าง Archer, Scout หรือ Musketeer หรือแม้ Wizard ก็ยังดีในการใช้และสร้างความเสียหายมาก ข้างคู่กับใครก็ได้",

    # Penguin Queen Austeja
    "Penguin Queen Austeja|skill1": "เย็น คลื่น CD 10s แผ่คลื่นเย็นออกไปโจมตีศัตรูรอบด้าน สร้างความเสียหาย 643% [Additional Effect] ลด cooldown ของสกิลนี้เท่ากับเปอร์เซ็นต์ของโจมตีความเร็ว boost (สูงสุด 60%)",
    "Penguin Queen Austeja|skill2": "Cryo Essence CD 30s ฮีล 30% ของ max HP แก่ตัวเอง, เจ้าของ และทุก fellows ในรัศมี 5m และเรียก Cryo Essence ที่พื้นที่สุ่มใกล้เคียง 10s Austeja จะพยายามเก็บ essence หลังเก็บแล้ว ให้ตัวเอง, เจ้าของ และทุก fellows 25% block Rate 10s",
    "Penguin Queen Austeja|skill3": "Wax คริสตัล CD 30s วาง Wax คริสตัลที่ตำแหน่งศัตรู 10s ทำให้เคลื่อนที่ไม่ได้ Wax สามารถถูกโจมตีโดยศัตรู เมื่อ Wax ถูกทำลายหรือระยะเวลาสิ้นสุด ให้ Wax แก่ศัตรูใกล้เคียง 10s ลด movement ความเร็ว 20% และ defense 10%",
    "Penguin Queen Austeja|awakenSkill": "(Not) Emperor พุ่ง [Unlock ที่ rank 1] CD 120s สั่ง penguins พุ่งไปข้างหน้าต่อเนื่อง 3s สร้างความเสียหาย 433% ทุก 0.3s Freeze ศัตรูเมื่อโดน และให้ Awakening แก่ตัวเอง 30s [Awakening - Austeja] - เพิ่ม movement ความเร็ว 50% และลด damage taken 35%",
    "Penguin Queen Austeja|tierlist_notes": "ฮีลเยอะ buff เยอะ ใช้ได้ตั้งแต่ rank 2 และต่อไปเรื่อยๆ upgrade ของเธอดีมาก stack ทั้ง offensive & defensive ทุก upgrade ใช้ได้ในทุก content Max HP buff ให้คุณหลัง rank 5 มหาศาล (+30%) ทำให้เธอดีมากในการเพิ่มความอึดให้ class ที่เปราะบางด้วย",

    # Dawn Raven Rexipher
    "Dawn Raven Rexipher|skill1": "Sunder [ไม่มี cooldown, ใช้หลังพื้นฐานโจมตีในจำนวนสะสม] ฟาดพื้นด้วยอาวุธ สร้าง shockwave ที่สร้างความเสียหาย 615% Earth damage ทุก 0.3s เป็นเวลา 2.5s และให้ Sunder แก่ศัตรู 5s [Sunder - Physical type debuff] ลด crit resistance 25% เพิ่ม damage ที่รับ 20%",
    "Dawn Raven Rexipher|skill2": "เงา Fall [ไม่มี cooldown, ใช้หลังพื้นฐานโจมตีในจำนวนสะสม] ซ่อนในเงาแล้ว teleport ไปเงาของศัตรู โจมตีพวกเขาจากด้านหลัง สร้างความเสียหาย 1736% x2 [Additional Effect] สร้างความเสียหาย 100% เพิ่มเติมแก่ศัตรูที่มี Sunder",
    "Dawn Raven Rexipher|skill3": "Eye of Dawn [ไม่มี cooldown, ใช้หลังพื้นฐานโจมตีในจำนวนสะสม] ทำให้ซ่อนทันที 1.5s หลังระยะเวลาซ่อนสิ้นสุด ให้ Protection of Dawn แก่ตัวเองและเจ้าของ 10s [Protection of Dawn] ลด damage taken 40%",
    "Dawn Raven Rexipher|awakenSkill": "Yata-Garasu [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s และปล่อยพื้นที่เงา 30s สร้างความเสียหาย 627% แก่ศัตรูสุ่มในพื้นที่ทุกวินาที [Awakening - Rexipher] Crit โอกาส set เป็น 100% Crit damage +50%",
    "Dawn Raven Rexipher|tierlist_notes": "unit ที่มี damage และ ceiling สูงมากแต่แพง เหมือนทุก Male demigod fellow อื่น พวกเขาถูกใช้เป็นหลักสำหรับ PvP แต่ไปถึงมีประโยชน์สำหรับ PvE ต้องการ rank สูงและการลงทุนเฉพาะ แต่สำหรับเขา คุ้มค่ามากถ้าคุณโชคดีได้ R7 เขาตั้งแต่ต้น",

    # Fortune Bunny Girl Lucy
    "Fortune Bunny Girl Lucy|skill1": "สuffle [CD 5s] สuffle deck ของเธอแล้วจั่วไพ่ ให้ effect พื้นฐานบนไพ่ที่จั่ว: - Great: ให้ buff 10s แก่ตัวเอง, เจ้าของ และทุก fellows ลด damage taken 10% - Excellent: ให้ buff 10s แก่ตัวเอง, เจ้าของ และทุก fellows เพิ่ม damage 25% - สมบูรณ์แบบ: ให้ทั้ง effect Great และ Excellent - Oh ของฉัน Giltine!: ฮีล 100% Max HP แก่ทุก allies ให้ effect Great และ Excellent และสร้างความเสียหาย 2345% แก่ศัตรูรอบด้าน",
    "Fortune Bunny Girl Lucy|skill2": "Rolling Board [CD 30s] ขว้าง dart ไปยัง rotating dartboard ให้ effect พื้นฐานบนจำนวนที่ขว้าง: - 1 [ใหญ่ ล้มเหลว!]: Lucy กลายเป็น invisible 2s จาก being shocked โดยการโยนที่ห่วยแตกของเธอ - 2-19: ให้ buff Rolling แก่ตัวเอง, เจ้าของ และทุก fellows 15s เพิ่มโจมตีเท่ากับจำนวนที่ขว้าง% - 20 [Great สำเร็จ!]: ให้ Rolling พื้นฐานบนจำนวน 20 และให้ buff Rolling-Bonus 15s ทุก Damage ignore 25% Def buff Rolling และ Rolling Bonus จะถูกลบทันทีเมื่อ Lucy ถูกลบออกจากทีม",
    "Fortune Bunny Girl Lucy|skill3": "Surprise Box [CD 30s] ซ่อนในกล่องแล้วปรากฏทันที โจมตีศัตรูรอบด้านสร้างความเสียหาย 1090% และ knock พวกเขากลับ สำหรับผู้เล่นและ fellow knock พวกเขากลับอย่างรุนแรง (ใน Arena stun แทน) ให้ Surprise Box แก่เจ้าของและทุก fellow เพิ่มโจมตี 15% 15s",
    "Fortune Bunny Girl Lucy|awakenSkill": "Lucky โอกาส [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s และให้ stacks Token สูงสุด [Awakening - Lucy] ทุก 5s สุ่ม buff Rouge หรือ Noir แก่ทุก allies Rouge: เพิ่ม damage 25% 5s Noir: ลด damage taken 10% 5s",
    "Fortune Bunny Girl Lucy|tierlist_notes": "Double Mechanic และ team-wide buff พิสูจน์ว่าการใช้งานของเธอดีในการแทนที่ slot ของ Aura Black ทั่วไปและ buff ใหม่ที่ใช้ได้นาน อย่างน้อย 6 เดือน (2 Demigod rotations)",

    # Blue Rose Sorcsha
    "Blue Rose Sorcsha|skill1": "Fente Eclat [CD 10s] พุ่งไปข้างหน้าอย่างรวดเร็ว สร้างความเสียหาย 3014% แก่ศัตรูในทิศทาง ศัตรูขนาดใหญ่อาจรับหลาย hit",
    "Blue Rose Sorcsha|skill2": "Riposte [CD 20s] หมุน rapier ในท่า counterattack 2s Immune ต่อทุก damage เมื่อรับ hit จะ counterattack ด้วยการฟาดไปข้างหน้า สร้างความเสียหาย 3364% (Reactivation cooldown 0.5s) หลังท่าสิ้นสุด ฟาดไปข้างหน้าอย่างรวดเร็ว สร้างความเสียหาย 1067% x 5",
    "Blue Rose Sorcsha|skill3": "Fleche d'Epines [CD 30s] แทงและสวิงด้วย Lightning ความเร็วเพื่อสร้าง 12 เวทย์มนตร์ thorns พุ่งไปข้างหน้า สร้างความเสียหาย 1656% x 12",
    "Blue Rose Sorcsha|awakenSkill": "Rose Bleue [Unlock ที่ rank 1] CD 120s เข้าสู่สถานะ Awakening 30s [Awakening - Sorcsha] - เพิ่ม damage dealt 50% ของโจมตี x % ของ HP เป้าหมายที่ขาด - ที่ระยะเวลาปกติ teleport ไปศัตรูสุ่มในพิสัยแล้วโจมตี สร้างความเสียหาย 279%",
    "Blue Rose Sorcsha|tierlist_notes": "มีพลังสูงแต่ใช้เวลานานเกินไปในการ ramp up stacks ของ Blue Rose Protection ทำให้เธอมีประโยชน์เฉพาะสำหรับ fight ที่ยาวนาน แต่ debuff จาก Royal Garden (rank 3) ทำให้ศัตรูรับ damage มากขึ้น apply ไปทั้ง party member รวมถึง guildmate ทำให้เธอกลายเป็น must-have สำหรับ guild raid content ที่ท้าทาย Damage amplify & Atk boost ตอนนี้กลายเป็นอิ่มตัว ดังนั้น offensive boost ของเธอแม้ดูสูงในตัวเลข ไม่ต่างกันมากจาก unit อื่น",
}


def main():
    with open('content/tos-m/fellows-db.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    count = 0
    for fellow in data:
        name = fellow.get('name', '')
        for key in ['leaderSkill', 'basicAttack', 'skill1', 'skill2', 'skill3', 'awakenSkill']:
            dict_key = f"{name}|{key}"
            if dict_key in CORRECTIONS and fellow.get(key):
                fellow[key] = CORRECTIONS[dict_key]
                count += 1

        if 'tierlist' in fellow and fellow['tierlist']:
            notes_key = f"{name}|tierlist_notes"
            if notes_key in CORRECTIONS and fellow['tierlist'].get('notes'):
                fellow['tierlist']['notes'] = CORRECTIONS[notes_key]
                count += 1

    with open('content/tos-m/fellows-db.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Applied {count} corrections")


if __name__ == '__main__':
    main()
