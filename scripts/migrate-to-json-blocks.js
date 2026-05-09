#!/usr/bin/env node
/**
 * TGLabs Content Migration: HTML → JSON Blocks
 * 
 * รัน: node scripts/migrate-to-json-blocks.js
 * 
 * อ่าน articles ที่มี content เป็น HTML string
 * แปลงเป็น JSON blocks แล้วอัปเดตกลับไป Supabase
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pegajhvjrldsdzfyppcv.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZ2FqaHZqcmxkc2R6ZnlwcGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ1NjUsImV4cCI6MjA5MDgwMDU2NX0.QKo9tTznbgqbCAPAow6DxZXBa_T69PM-yq4PUoD0hhM';

async function fetchArticles() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?is_published=eq.true&select=id,slug,title,content,hero_image,hero_caption&limit=50`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );
  const data = await res.json();
  // Filter to only those with HTML content (not JSON)
  return Array.isArray(data) ? data.filter(a => a.content && !a.content.trim().startsWith('[') && !a.content.trim().startsWith('{')) : [];
}

function htmlToBlocks(html) {
  if (!html || typeof html !== 'string') return [];
  
  const blocks = [];
  let paraIndex = 0;
  
  // Split by block-level tag starts
  const tagPattern = /<(p|h[1-6]|ul|ol|blockquote|div|figure|hr)(?:\s[^>]*)?>/gi;
  const parts = html.split(tagPattern);
  
  // The first part is before any tag — use it as intro paragraph
  const firstPart = parts[0]?.trim();
  if (firstPart && firstPart.length > 10) {
    blocks.push({ type: 'paragraph', content: stripHtml(firstPart) });
  }
  
  // parts alternates: [text, tagName, attr, content, tagName, attr, content, ...]
  // Index 0 = text before first tag
  // Index 1 = first tag name
  // Index 2 = first tag attrs
  // Index 3 = content
  // Index 4 = second tag name (closing)
  // etc.
  let i = 1;
  while (i < parts.length) {
    const tagName = (parts[i] || '').toLowerCase();
    const attrs = parts[i + 1] || '';
    const content = parts[i + 2] || '';
    i += 3;
    
    const text = content.trim();
    if (!text && tagName !== 'img') continue;
    
    switch (tagName) {
      case 'p': {
        const stripped = stripHtml(text);
        if (stripped) {
          blocks.push({ type: 'paragraph', content: stripped });
          paraIndex++;
        }
        break;
      }
      case 'h1':
      case 'h2':
      case 'h3': {
        const level = parseInt(tagName[1]);
        blocks.push({ type: 'heading', level, content: stripHtml(text) });
        break;
      }
      case 'ul':
      case 'ol': {
        const liMatches = text.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (liMatches && liMatches.length > 0) {
          const items = liMatches.map(li => stripHtml(li));
          blocks.push({ type: 'bullet', items });
        }
        break;
      }
      case 'blockquote': {
        blocks.push({ type: 'quote', content: stripHtml(text) });
        break;
      }
      case 'div': {
        // Check for highlight-box
        if (/class=["'][^"']*highlight-box[^"']*["']/i.test(attrs) || text.includes('📌')) {
          const liMatches = text.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          if (liMatches && liMatches.length > 0) {
            const items = liMatches.map(li => stripHtml(li));
            blocks.push({ type: 'bullet', items });
          }
          blocks.push({ type: 'rule', label: 'สรุป' });
        }
        break;
      }
      case 'hr': {
        blocks.push({ type: 'rule' });
        break;
      }
      case 'figure': {
        // Extract img from figure
        const imgMatch = text.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch) {
          const captionMatch = text.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
          blocks.push({
            type: 'image',
            imageUrl: imgMatch[1],
            imageCaption: captionMatch ? stripHtml(captionMatch[1]) : undefined,
          });
        }
        break;
      }
    }
  }
  
  return blocks;
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function updateArticle(id, content) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        content: JSON.stringify(content),
      }),
    }
  );
  return res.ok;
}

async function main() {
  console.log('🔄 เริ่ม migration HTML → JSON Blocks\n');
  
  const articles = await fetchArticles();
  console.log(`📰 พบ ${articles.length} articles ที่ต้อง migrate\n`);
  
  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const article of articles) {
    try {
      // Check if already JSON
      const trimmed = (article.content || '').trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        console.log(`⏭️  Skip (already JSON): ${article.slug}`);
        skipped++;
        continue;
      }
      
      // Convert HTML to blocks
      const blocks = htmlToBlocks(article.content);
      
      if (blocks.length === 0) {
        console.log(`⚠️  Empty result: ${article.slug}`);
        errors++;
        continue;
      }
      
      // Remove image blocks (they go to inline_images)
      const contentBlocks = blocks.filter(b => b.type !== 'image');
      
      // Update
      const ok = await updateArticle(article.id, contentBlocks);
      
      if (ok) {
        migrated++;
        console.log(`✅ Migrated: ${article.slug} (${blocks.length} blocks)`);
      } else {
        errors++;
        console.log(`❌ Failed: ${article.slug}`);
      }
    } catch (err) {
      errors++;
      console.log(`❌ Error: ${article.slug} — ${err.message}`);
    }
  }
  
  console.log(`\n📊 สรุป: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
  
  if (migrated > 0) {
    console.log('\n✅ Migration เสร็จสมบูรณ์');
  } else if (errors > 0) {
    console.log('\n⚠️ มี errors ให้ตรวจสอบด้านบน');
  } else {
    console.log('\n📝 ไม่มีอะไรต้อง migrate');
  }
}

main().catch(console.error);