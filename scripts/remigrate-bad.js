#!/usr/bin/env node
/**
 * Re-migrate bad/partial JSON migrations
 * ใช้สำหรับ articles ที่ migration ก่อนหน้าทำไม่สมบูรณ์
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

async function getAllArticles() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?is_published=eq.true&select=id,slug,content&limit=50`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: 'Bearer ' + ANON_KEY,
      },
    }
  );
  return res.json();
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function updateArticle(id, content) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ content: JSON.stringify(content) }),
    }
  );
  return res.ok;
}

// Detect bad JSON migrations: short content that looks like HTML fragments
function isBadMigration(content) {
  if (!content || typeof content !== 'string') return false;
  if (!content.trim().startsWith('[')) return false;
  try {
    const parsed = JSON.parse(content);
    // Bad if: single paragraph with very short content, or content looks like HTML tag names
    if (parsed.length === 1 && parsed[0]?.type === 'paragraph') {
      const text = parsed[0].content || '';
      if (text.length < 50 || text.match(/^(h[1-6]|p|div|ul|li|blockquote)$/i)) {
        return true;
      }
    }
    // Also bad if it's obviously HTML mixed in
    if (content.includes('<p>') || content.includes('<h') || content.includes('<ul')) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function main() {
  console.log('🔍 ค้นหา articles ที่ migration ไม่สมบูรณ์\n');
  
  const articles = await getAllArticles();
  
  // Find bad migrations
  const badOnes = articles.filter(a => isBadMigration(a.content));
  
  if (badOnes.length === 0) {
    console.log('✅ ไม่พบ articles ที่ต้อง re-migrate');
    return;
  }
  
  console.log(`⚠️  พบ ${badOnes.length} articles ที่ migration ไม่สมบูรณ์:`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const article of badOnes) {
    console.log(`\n📝 ${article.slug}`);
    
    // Re-parse original content (the content field currently has bad JSON, we need to re-fetch from history)
    // Actually we can't get the original HTML back since it was overwritten
    // So we'll try to parse the bad JSON to see what we have
    try {
      const parsed = JSON.parse(article.content);
      console.log('  Current (bad):', JSON.stringify(parsed));
    } catch {
      console.log('  Cannot parse current content');
    }
    
    // If it's HTML in JSON form, try to extract text
    const currentContent = article.content;
    if (currentContent.includes('<') && currentContent.includes('>')) {
      // There's HTML in the JSON - can we recover?
      // The content might have been saved as HTML string incorrectly
      // Let's try to strip HTML tags from it and make a simple paragraph
      const text = stripHtml(currentContent.replace(/\\"/g, '"').replace(/"/g, '"'));
      if (text.length > 10) {
        console.log('  💡 Recovered text:', text.slice(0, 60));
        const blocks = [{ type: 'paragraph', content: text }];
        const ok = await updateArticle(article.id, blocks);
        if (ok) {
          migrated++;
          console.log('  ✅ Re-migrated with recovered text');
        } else {
          failed++;
          console.log('  ❌ Failed');
        }
      } else {
        console.log('  ⚠️  Cannot recover - skipping');
        failed++;
      }
    } else {
      console.log('  ⚠️  No HTML found in content - skipping');
      failed++;
    }
  }
  
  console.log(`\n📊 สรุป: ${migrated} re-migrated, ${failed} failed`);
}

main().catch(e => console.error(e));
