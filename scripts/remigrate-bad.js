#!/usr/bin/env node
/**
 * Re-migrate bad/partial JSON migrations
 * ใช้สำหรับ articles ที่ migration ก่อนหน้าทำไม่สมบูรณ์
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpาจmI6MTc3NTIyNDU2NSwiZXhwIjo yMDkwODAwNTY1fQ.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function extractListItems(html) {
  const items = [];
  const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches) {
    for (const li of liMatches) {
      const content = li.replace(/<\/?li[^>]*>/gi, '');
      items.push(stripHtml(content));
    }
  }
  return items;
}

function htmlToBlocks(html) {
  if (!html || typeof html !== 'string') return [];
  const blocks = [];
  
  const blockPatterns = [
    { regex: /<h([1-3])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, handler: (m) => ({
        type: 'heading', level: parseInt(m[1]), content: stripHtml(m[2])
      })
    },
    { regex: /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi, handler: (m) => {
        const content = stripHtml(m[1]);
        return content ? { type: 'paragraph', content } : null;
      }
    },
    { regex: /<ul(?:\s[^>]*)?>([\s\S]*?)<\/ul>/gi, handler: (m) => {
        const items = extractListItems(m[1]);
        return items.length > 0 ? { type: 'bullet', items } : null;
      }
    },
    { regex: /<ol(?:\s[^>]*)?>([\s\S]*?)<\/ol>/gi, handler: (m) => {
        const items = extractListItems(m[1]);
        return items.length > 0 ? { type: 'bullet', items } : null;
      }
    },
    { regex: /<blockquote(?:\s[^>]*)?>([\s\S]*?)<\/blockquote>/gi, handler: (m) => {
        const content = stripHtml(m[1]);
        return content ? { type: 'quote', content } : null;
      }
    },
    { regex: /<hr\s*\/?>/gi, handler: () => ({ type: 'rule' }) },
    { regex: /<div(?:\s[^>]*)?class=["'][^"']*highlight-box[^"']*["'](?:[^>]*)>([\s\S]*?)<\/div>/gi, handler: (m) => {
        const items = extractListItems(m[1]);
        blocks.push({ type: 'bullet', items });
        blocks.push({ type: 'rule', label: 'สรุป' });
        return null;
      }
    },
    { regex: /<figure(?:\s[^>]*)?>([\s\S]*?)<\/figure>/gi, handler: (m) => {
        const imgMatch = m[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch) {
          const captionMatch = m[1].match(/<figcaption(?:\s[^>]*)?>([\s\S]*?)<\/figcaption>/i);
          return { type: 'image', imageUrl: imgMatch[1], imageCaption: captionMatch ? stripHtml(captionMatch[1]) : undefined };
        }
        return null;
      }
    },
    { regex: /<img[^>]+src=["']([^"']+)["'][^>]*>/gi, handler: (m) => ({ type: 'image', imageUrl: m[1] }) }
  ];
  
  const foundBlocks = [];
  for (const pattern of blockPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(html)) !== null) {
      const block = pattern.handler(match);
      if (block) {
        foundBlocks.push({ index: match.index, block });
      }
    }
  }
  
  foundBlocks.sort((a, b) => a.index - b.index);
  const seen = new Set();
  for (const fb of foundBlocks) {
    const key = JSON.stringify(fb.block);
    if (!seen.has(key)) {
      seen.add(key);
      blocks.push(fb.block);
    }
  }
  
  if (blocks.length === 0) {
    const text = stripHtml(html);
    if (text && text.length > 0) {
      blocks.push({ type: 'paragraph', content: text });
    }
  }
  
  return blocks;
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
  } catch (e) {
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
    } catch (e) {
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