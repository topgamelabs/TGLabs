#!/usr/bin/env python3
import json
import re

with open('content/tos-m/fellows-db.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def translate_skill(text):
    if not text or text == "ไม่มี":
        return text
    
    # Skip if already has Thai characters
    if re.search(r'[\u0e00-\u0e7f]', text):
        return text
    
    # Keep skill names and technical terms, translate descriptions
    # This is a simplified approach - keeping names, translating effects
    
    replacements = [
        # Common action verbs
        (r'\bAttack\b', 'โจมตี'),
        (r'\battack\b', 'โจมตี'),
        (r'\bDealing\b', 'สร้างความเสียหาย'),
        (r'\bdealing\b', 'สร้างความเสียหาย'),
        (r'\bDeal\b', 'สร้าง'),
        (r'\bdeal\b', 'สร้าง'),
        (r'\bDeals\b', 'สร้าง'),
        (r'\bdeals\b', 'สร้าง'),
        (r'\bGrant\b', 'ให้'),
        (r'\bgrant\b', 'ให้'),
        (r'\bReduce\b', 'ลด'),
        (r'\breduce\b', 'ลด'),
        (r'\bIncrease\b', 'เพิ่ม'),
        (r'\bincrease\b', 'เพิ่ม'),
        (r'\bInflict\b', 'สร้าง'),
        (r'\binflict\b', 'สร้าง'),
        (r'\bHeal\b', 'รักษา'),
        (r'\bheal\b', 'รักษา'),
        (r'\bHealing\b', 'การรักษา'),
        (r'\bhealing\b', 'การรักษา'),
        
        # Common effect terms
        (r'\bDamage\b', 'ความเสียหาย'),
        (r'\bdamage\b', 'ความเสียหาย'),
        (r'\bStun\b', 'Stun'),
        (r'\bstun\b', 'Stun'),
        (r'\bBurn\b', 'Burn'),
        (r'\bburn\b', 'Burn'),
        (r'\bFreeze\b', 'Freeze'),
        (r'\bfreeze\b', 'Freeze'),
        (r'\bSlow\b', 'Slow'),
        (r'\bslow\b', 'Slow'),
        (r'\bSilence\b', 'Silence'),
        (r'\bsilence\b', 'Silence'),
        
        # Common nouns
        (r'\bEnemy\b', 'ศัตรู'),
        (r'\benemy\b', 'ศัตรู'),
        (r'\bEnemies\b', 'ศัตรู'),
        (r'\benemies\b', 'ศัตรู'),
        (r'\bAlly\b', 'ally'),
        (r'\bally\b', 'ally'),
        (r'\bAllies\b', 'allies'),
        (r'\ballies\b', 'allies'),
        (r'\bTarget\b', 'เป้าหมาย'),
        (r'\btarget\b', 'เป้าหมาย'),
        (r'\bArea\b', 'พื้นที่'),
        (r'\barea\b', 'พื้นที่'),
        (r'\bRadius\b', 'รัศมี'),
        (r'\bradius\b', 'รัศมี'),
        (r'\bAround\b', 'รอบ'),
        (r'\baround\b', 'รอบ'),
        (r'\bForward\b', 'ไปข้างหน้า'),
        (r'\bforward\b', 'ไปข้างหน้า'),
        (r'\bSelf\b', 'ตัวเอง'),
        (r'\bself\b', 'ตัวเอง'),
        
        # Common prepositions and conjunctions
        (r'\bfor\b', 'สำหรับ'),
        (r'\bwith\b', 'ด้วย'),
        (r'\band\b', 'และ'),
        (r'\bthe\b', 'the'),
        (r'\ba\b', 'a'),
        (r'\bto\b', 'ไป'),
        (r'\bby\b', 'โดย'),
        (r'\bfrom\b', 'จาก'),
        (r'\bin\b', 'ใน'),
        (r'\bon\b', 'บน'),
        (r'\bat\b', 'ที่'),
        (r'\bper\b', 'ต่อ'),
        
        # Time related
        (r'\bsecond\b', 'วินาที'),
        (r'\bseconds\b', 'วินาที'),
        (r'\bevery\b', 'ทุก'),
        
        # Common adjectives
        (r'\bEvery\b', 'ทุก'),
        (r'\bEach\b', 'แต่ละ'),
        (r'\bRandom\b', 'สุ่ม'),
        (r'\brandom\b', 'สุ่ม'),
        (r'\bFrontal\b', 'ด้านหน้า'),
        (r'\bfrontal\b', 'ด้านหน้า'),
        (r'\bAdditional\b', 'เพิ่มเติม'),
        (r'\badditional\b', 'เพิ่มเติม'),
        
        # Action verbs
        (r'\bThrow\b', 'ขว้าง'),
        (r'\bthrow\b', 'ขว้าง'),
        (r'\bShoot\b', 'ยิง'),
        (r'\bshoot\b', 'ยิง'),
        (r'\bCreate\b', 'สร้าง'),
        (r'\bcreate\b', 'สร้าง'),
        (r'\bSpawn\b', 'เรียก'),
        (r'\bspawn\b', 'เรียก'),
        (r'\bSummon\b', 'เรียก'),
        (r'\bsummon\b', 'เรียก'),
        (r'\bJump\b', 'กระโดด'),
        (r'\bjump\b', 'กระโดด'),
        (r'\bDash\b', 'พุ่ง'),
        (r'\bdash\b', 'พุ่ง'),
        (r'\bTeleport\b', 'Teleport'),
        (r'\bteleport\b', 'Teleport'),
        (r'\bStealth\b', 'Stealth'),
        (r'\bstealth\b', 'Stealth'),
        (r'\bImmune\b', 'ต้านทาน'),
        (r'\bimmune\b', 'ต้านทาน'),
        (r'\bBlock\b', 'Block'),
        (r'\bblock\b', 'block'),
        (r'\bEvade\b', 'Evade'),
        (r'\bevade\b', 'evade'),
        (r'\bPierce\b', 'เจาะทะลุ'),
        (r'\bpierce\b', 'เจาะทะลุ'),
        (r'\bPiercing\b', 'เจาะทะลุ'),
        (r'\bpiercing\b', 'เจาะทะลุ'),
        (r'\bKnockback\b', 'Knockback'),
        (r'\bknockback\b', 'knockback'),
        (r'\bKnock\b', 'knock'),
        (r'\bknock\b', 'knock'),
        
        # Common adverbs
        (r'\bRapidly\b', 'อย่างรวดเร็ว'),
        (r'\brapidly\b', 'อย่างรวดเร็ว'),
        (r'\bContinuously\b', 'อย่างต่อเนื่อง'),
        (r'\bcontinuously\b', 'อย่างต่อเนื่อง'),
        (r'\bInstantly\b', 'ทันที'),
        (r'\binstantly\b', 'ทันที'),
        
        # Speed related
        (r'\bSpeed\b', 'ความเร็ว'),
        (r'\bspeed\b', 'ความเร็ว'),
        (r'\bMovement\b', 'การเคลื่อนที่'),
        (r'\bmovement\b', 'การเคลื่อนที่'),
        
        # Stat related
        (r'\bHP\b', 'HP'),
        (r'\bSP\b', 'SP'),
        (r'\bAtk\b', 'Atk'),
        (r'\bDef\b', 'Def'),
        (r'\bCrit\b', 'Crit'),
        (r'\bRate\b', 'Rate'),
        
        # Chance related
        (r'\bchance\b', 'โอกาส'),
        (r'\bChance\b', 'โอกาส'),
        
        # Stack related
        (r'\bstack\b', 'stack'),
        (r'\bStack\b', 'Stack'),
        (r'\bstacks\b', 'stacks'),
        (r'\bStacks\b', 'Stacks'),
        
        # Duration related
        (r'\bDuration\b', 'ระยะเวลา'),
        (r'\bduration\b', 'ระยะเวลา'),
        
        # Power related
        (r'\bPower\b', 'พลัง'),
        (r'\bpower\b', 'พลัง'),
        
        # Types
        (r'\bFire\b', 'Fire'),
        (r'\bIce\b', 'Ice'),
        (r'\bLightning\b', 'Lightning'),
        (r'\bEarth\b', 'Earth'),
        (r'\bHoly\b', 'Holy'),
        (r'\bDark\b', 'Dark'),
        (r'\bMulti\b', 'Multi'),
        (r'\bPhysical\b', 'Physical'),
        (r'\bMagical\b', 'Magical'),
        
        # Status effects
        (r'\bAwakening\b', 'Awakening'),
        (r'\bAwaken\b', 'Awaken'),
        (r'\bPoison\b', 'Poison'),
        (r'\bBleeding\b', 'Bleeding'),
        (r'\bBleed\b', 'Bleed'),
        (r'\bLethargy\b', 'Lethargy'),
        (r'\bAtrophy\b', 'Atrophy'),
        (r'\bWeak\b', 'Weak'),
        (r'\bConfusion\b', 'Confusion'),
        (r'\bFear\b', 'Fear'),
        (r'\bCharm\b', 'Charm'),
        (r'\bPetrified\b', 'Petrified'),
        (r'\bBlind\b', 'Blind'),
        (r'\bCurse\b', 'Curse'),
        
        # Classes
        (r'\bWarrior\b', 'Warrior'),
        (r'\bMage\b', 'Mage'),
        (r'\bCleric\b', 'Cleric'),
        (r'\bRogue\b', 'Rogue'),
        (r'\bArcher\b', 'Archer'),
        (r'\bKnight\b', 'Knight'),
        
        # Common phrases
        (r'\bAll targets\b', 'เป้าหมายทั้งหมด'),
        (r'\ball targets\b', 'เป้าหมายทั้งหมด'),
        (r'\bAll enemies\b', 'ศัตรูทั้งหมด'),
        (r'\ball enemies\b', 'ศัตรูทั้งหมด'),
        (r'\bAll allies\b', 'allies ทั้งหมด'),
        (r'\ball allies\b', 'allies ทั้งหมด'),
        (r'\bhit\.', 'hit'),
        (r'\bhit,', 'hit'),
        (r'\bhit', 'hit'),
    ]
    
    result = text
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)
    
    return result

# Translate all fellows
for fellow in data:
    # Translate skill descriptions
    for skill_key in ['basicAttack', 'skill1', 'skill2', 'skill3', 'awakenSkill', 'leaderSkill', 'acquireBonus']:
        if skill_key in fellow and fellow[skill_key]:
            fellow[skill_key] = translate_skill(fellow[skill_key])
    
    # Translate tierlist notes
    if 'tierlist' in fellow and 'notes' in fellow['tierlist'] and fellow['tierlist']['notes']:
        fellow['tierlist']['notes'] = translate_skill(fellow['tierlist']['notes'])

with open('content/tos-m/fellows-db.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Translation complete!")
