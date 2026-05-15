/**
 * Fix duplicate hero_images in Supabase
 * Run: npx ts-node --esm scripts/fix-duplicate-hero-images.ts
 * Or: npx tsx scripts/fix-duplicate-hero-images.ts
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

const SUPABASE_URL: string = supabaseUrl;
const SUPABASE_KEY: string = supabaseKey;

function generateUniqueHeroImage(slug: string): string {
  const seed = slug.split('-').slice(0, 3).join('-');
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/400`;
}

async function getArticlesWithDuplicateHeroImages() {
  // Get all articles with their source_url and hero_image
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?select=id,title,slug,hero_image,source_url&order=created_at.desc&limit=500`,
    {
      headers: {
        apikey: SUPABASE_KEY,
      },
      next: { revalidate: 0 },
    }
  );

  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error('Failed to fetch articles');
    return [];
  }

  // Group by source_url + hero_image
  const groups: Record<string, typeof data> = {};
  for (const article of data) {
    if (!article.source_url || !article.hero_image) continue;
    const key = `${article.source_url}|${article.hero_image}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(article);
  }

  // Find duplicates
  const duplicates: Array<{ sourceUrl: string; heroImage: string; articles: typeof data }> = [];
  for (const [key, articles] of Object.entries(groups)) {
    if (articles.length > 1) {
      const [sourceUrl, heroImage] = key.split('|');
      duplicates.push({ sourceUrl, heroImage, articles });
    }
  }

  return duplicates;
}

async function updateArticle(id: string, heroImage: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ hero_image: heroImage }),
    }
  );

  return res.ok;
}

async function fix() {
  console.log('🔍 Finding duplicate hero_images...\n');

  const duplicates = await getArticlesWithDuplicateHeroImages();
  console.log(`Found ${duplicates.length} groups of duplicate hero_images\n`);

  let fixedCount = 0;

  for (const group of duplicates) {
    console.log(`📰 Source: ${group.sourceUrl.slice(0, 60)}...`);
    console.log(`   Hero: ${group.heroImage.slice(0, 60)}...`);
    console.log(`   Articles: ${group.articles.length}`);

    // Keep first article's hero_image, fix the rest
    for (let i = 1; i < group.articles.length; i++) {
      const article = group.articles[i];
      const newHeroImage = generateUniqueHeroImage(article.slug);

      const ok = await updateArticle(article.id, newHeroImage);
      if (ok) {
        console.log(`   ✅ Fixed: "${article.title.slice(0, 50)}..." → ${newHeroImage.slice(0, 50)}...`);
        fixedCount++;
      } else {
        console.log(`   ❌ Failed: ${article.id}`);
      }
    }
    console.log('');
  }

  console.log(`\n✅ Done! Fixed ${fixedCount} articles`);
}

fix().catch(console.error);
