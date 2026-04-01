// Comprehensive Fellow CSV Parser
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csv = fs.readFileSync('./fellows-full.csv', 'utf-8');

const records = parse(csv, {
  columns: false,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
  ltrim: true,
  rtrim: true
});

console.log('Total rows:', records.length);

// Extract fellows with proper grade assignment
const fellows = [];
let currentGrade = '';
let currentName = '';

for (let i = 3; i < records.length; i++) {
  const row = records[i];
  
  // Column 0 = Grade, Column 1 = Name
  const gradeCol = (row[0] || '').replace(/\n/g, ' ').trim();
  const nameCol = (row[1] || '').replace(/\n/g, ' ').trim();
  
  // Skip empty rows
  if (!nameCol) continue;
  
  // Update current grade if provided
  if (gradeCol) {
    currentGrade = gradeCol;
  }
  
  // Skip header-like rows
  if (gradeCol === 'Grade' || nameCol === 'Name') continue;
  if (nameCol.includes('Required Mats')) continue;
  
  // Parse class info (column 3)
  const classCol = (row[3] || '').replace(/-----/g, ' - ').replace(/\n/g, ' ').trim();
  
  // Parse obtain from (column 4)
  const obtainFrom = (row[4] || '').replace(/\n/g, ' ').trim();
  
  // Parse acquire bonus (column 5)
  const acquireBonus = (row[5] || '').replace(/\n/g, ' ').trim();
  
  // Parse leader skill (column 6)
  const leaderSkill = (row[6] || '').replace(/\n/g, ' ').trim();
  
  // Parse basic attack (column 7)
  const basicAttack = (row[7] || '').replace(/\n/g, ' ').trim();
  
  // Parse skills (columns 8-11)
  const skill1 = (row[8] || '').replace(/\n/g, ' ').trim();
  const skill2 = (row[9] || '').replace(/\n/g, ' ').trim();
  const skill3 = (row[10] || '').replace(/\n/g, ' ').trim();
  const awakenSkill = (row[11] || '').replace(/\n/g, ' ').trim();
  
  // Parse tierlist (columns 20-24)
  const tierDamage = (row[20] || '').replace(/\n/g, ' ').trim();
  const tierSurvival = (row[21] || '').replace(/\n/g, ' ').trim();
  const tierOffensiveSupport = (row[22] || '').replace(/\n/g, ' ').trim();
  const tierDefensiveSupport = (row[23] || '').replace(/\n/g, ' ').trim();
  const tierUtility = (row[24] || '').replace(/\n/g, ' ').trim();
  
  // Parse overall (column 25) - may include notes after the grade
  const tierOverallRaw = (row[25] || '').replace(/\n/g, ' ').trim();
  // Extract just the grade (first word) and notes
  const tierOverallMatch = tierOverallRaw.match(/^([A-Z+]+)/);
  const tierOverall = tierOverallMatch ? tierOverallMatch[1] : '';
  const tierNotes = tierOverallRaw.replace(/^[A-Z+]+\s*/, '').trim();
  
  // Parse required mats (column 26)
  const requiredMats = (row[26] || '').replace(/\n/g, ' ').trim();
  
  fellows.push({
    grade: currentGrade,
    name: nameCol,
    classInfo: classCol,
    obtainFrom,
    acquireBonus,
    leaderSkill,
    basicAttack,
    skill1,
    skill2,
    skill3,
    awakenSkill,
    tierlist: {
      damage: tierDamage,
      survival: tierSurvival,
      offensiveSupport: tierOffensiveSupport,
      defensiveSupport: tierDefensiveSupport,
      utility: tierUtility,
      overall: tierOverall,
      notes: tierNotes
    },
    requiredMats
  });
}

console.log('\\nParsed', fellows.length, 'fellows');

// Show summary by grade
const gradeCount = {};
fellows.forEach(f => {
  gradeCount[f.grade] = (gradeCount[f.grade] || 0) + 1;
});
console.log('\\nBy grade:');
Object.entries(gradeCount).forEach(([g, c]) => console.log(' ', g, ':', c));

// Show sample
console.log('\\n=== Sample Fellows ===');
fellows.slice(0, 3).forEach((f, i) => {
  console.log(`\\n${i+1}. ${f.grade} - ${f.name}`);
  console.log(`   Class: ${f.classInfo}`);
  console.log(`   Overall Tier: ${f.tierlist.overall}`);
});

// Save to JSON
fs.writeFileSync('./fellows-db-full.json', JSON.stringify(fellows, null, 2));
console.log('\\nSaved to fellows-db-full.json');
