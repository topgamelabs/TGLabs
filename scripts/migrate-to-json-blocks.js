#!/usr/bin/env node
/**
 * TGLabs Content Migration: HTML → JSON Blocks
 * 
 * รัน: SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-json-blocks.js
 * 
 * อ่าน articles ที่มี content เป็น HTML string
 * แปลงเป็น JSON blocks แล้วอัปเดตกลับไป Supabase
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchArticles() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?is_published=eq.true&select=id,slug,title,content,hero_image,hero_caption&limit=50`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: 'Bearer ' + ANON_KEY,
      },
    }
  );
  const data = await res.json();
  return Array.isArray(data) ? data.filter(a => a.content && !a.content.trim().startsWith('[') && !a.content.trim().startsWith('{')) : [];
}

// =====================
// HTML TO BLOCKS
// =====================

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, '')  // Remove all tags
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
  
  // Match block-level elements with their content
  // Pattern: opening tag + content + closing tag
  const blockPatterns = [
    // Headings h1-h3
    { regex: /<h([1-3])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, handler: (m) => ({
        type: 'heading',
        level: parseInt(m[1]),
        content: stripHtml(m[2])
      })
    },
    // Paragraphs
    { regex: /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi, handler: (m) => {
        const content = stripHtml(m[1]);
        return content ? { type: 'paragraph', content } : null;
      }
    },
    // Unordered lists
    { regex: /<ul(?:\s[^>]*)?>([\s\S]*?)<\/ul>/gi, handler: (m) => {
        const items = extractListItems(m[1]);
        return items.length > 0 ? { type: 'bullet', items } : null;
      }
    },
    // Ordered lists
    { regex: /<ol(?:\s[^>]*)?>([\s\S]*?)<\/ol>/gi, handler: (m) => {
        const items = extractListItems(m[1]);
        return items.length > 0 ? { type: 'bullet', items } : null;
      }
    },
    // Blockquotes
    { regex: /<blockquote(?:\s[^>]*)?>([\s\S]*?)<\/blockquote>/gi, handler: (m) => {
        const content = stripHtml(m[1]);
        return content ? { type: 'quote', content } : null;
      }
    },
    // Horizontal rules
    { regex: /<hr\s*\/?>/gi, handler: () => ({ type: 'rule' }) },
    // Divs (highlight-box)
    { regex: /<div(?:\s[^>]*)?class=["'][^"']*highlight-box[^"']*["'](?:[^>]*)>([\s\S]*?)<\/div>/gi, handler: (m) => {
        const items = extractListItems(m[1]);
        const block = { type: 'bullet', items };
        blocks.push(block);
        blocks.push({ type: 'rule', label: 'สรุป' });
        return null; // Already pushed
      }
    },
    // Figures with images
    { regex: /<figure(?:\s[^>]*)?>([\s\S]*?)<\/figure>/gi, handler: (m) => {
        const imgMatch = m[1].match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch) {
          const captionMatch = m[1].match(/<figcaption(?:\s[^>]*)?>([\s\S]*?)<\/figcaption>/i);
          return {
            type: 'image',
            imageUrl: imgMatch[1],
            imageCaption: captionMatch ? stripHtml(captionMatch[1]) : undefined
          };
        }
        return null;
      }
    },
    // Standalone images
    { regex: /<img[^>]+src=["']([^"']+)["'][^>]*>/gi, handler: (m) => ({
        type: 'image',
        imageUrl: m[1]
      })
    }
  ];
  
  // Process in order - find each block and its position
  const foundBlocks = [];
  
  for (const pattern of blockPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(html)) !== null) {
      const block = pattern.handler(match);
      if (block) {
        foundBlocks.push({
          index: match.index,
          block: block
        });
      }
    }
  }
  
  // Sort by position and deduplicate (keep first occurrence)
  foundBlocks.sort((a, b) => a.index - b.index);
  const seen = new Set();
  for (const fb of foundBlocks) {
    const key = JSON.stringify(fb.block);
    if (!seen.has(key)) {
      seen.add(key);
      blocks.push(fb.block);
    }
  }
  
  // If no blocks found, try to extract any text content
  if (blocks.length === 0) {
    const text = stripHtml(html);
    if (text && text.length > 0) {
      blocks.push({ type: 'paragraph', content: text });
    }
  }
  
  return blocks;
}

// =====================
// UPDATE & FETCH
// =====================

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
      body: JSON.stringify({
        content: JSON.stringify(content),
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.log('PATCH error:', err);
  }
  return res.ok;
}

async function getArticleContent(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}&select=content`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
      }
    }
  );
  const data = await res.json();
  return data[0]?.content || '';
}

// =====================
// MAIN
// =====================

async function main() {
  console.log('🔄 เริ่ม migration HTML → JSON Blocks\n');
  
  const articles = await fetchArticles();
  console.log(`📰 พบ ${articles.length} articles ที่ต้อง migrate\n`);
  
  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const article of articles) {
    try {
      console.log(`\n📝 ${article.slug}`);
      
      // Get fresh content (might have been partially updated)
      let content = article.content;
      
      // If content looks like partial JSON, re-fetch
      if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.length <= 1 && parsed[0]?.type === 'paragraph' && parsed[0]?.content?.length < 30) {
            // Likely a bad partial migration - re-fetch original
            content = await getArticleContent(article.id);
            console.log('  ↺ Re-fetched original content');
          }
        } catch {}
      }
      
      const blocks = htmlToBlocks(content);
      
      if (blocks.length === 0) {
        console.log('  ⚠️  Empty result - skipping');
        skipped++;
        continue;
      }
      
      console.log('  📦', blocks.length, 'blocks extracted');
      
      // Show first few blocks
      blocks.slice(0, 3).forEach((b, i) => {
        if (b.type === 'heading') console.log('    [' + i + '] heading: ' + b.content?.slice(0, 40));
        else if (b.type === 'paragraph') console.log('    [' + i + '] paragraph: ' + b.content?.slice(0, 40));
        else if (b.type === 'bullet') console.log('    [' + i + '] bullet: ' + b.items?.length + ' items');
        else if (b.type === 'rule') console.log('    [' + i + '] rule: ' + b.label);
        else if (b.type === 'image') console.log('    [' + i + '] image: ' + b.imageUrl?.slice(0, 40));
        else console.log('    [' + i + ']', b.type);
      });
      
      const ok = await updateArticle(article.id, blocks);
      
      if (ok) {
        migrated++;
        console.log('  ✅ Migrated');
      } else {
        failed++;
        console.log('  ❌ Failed');
      }
    } catch (err) {
      failed++;
      console.log('  ❌ Error:', err.message);
    }
  }
  
  console.log(`\n📊 สรุป: ${migrated} migrated, ${skipped} skipped, ${failed} errors`);
  
  if (migrated > 0) {
    console.log('\n✅ Migration เสร็จสมบูรณ์');
  }
}

main().catch(console.error);