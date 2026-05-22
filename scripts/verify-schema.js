const SUPABASE_URL = trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const USING_ANON_KEY = !process.env.SUPABASE_SERVICE_ROLE_KEY && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const REQUIRED_TABLES = [
  {
    name: 'articles',
    requiredColumns: [
      'id',
      'slug',
      'title',
      'excerpt',
      'content',
      'category',
      'game_id',
      'hero_image',
      'hero_caption',
      'author_id',
      'read_time',
      'rating',
      'view_count',
      'is_published',
      'is_featured',
      'seo_title',
      'seo_description',
      'published_at',
      'created_at',
      'updated_at',
      'source_url',
      'status',
      'ai_generated',
      'search_vector',
    ],
    recommendedColumns: ['inline_images'],
  },
  {
    name: 'raw_news_queue',
    requiredColumns: [
      'id',
      'source_id',
      'source_url',
      'source_domain',
      'raw_title',
      'raw_excerpt',
      'raw_content',
      'content_hash',
      'published_source_at',
      'discovered_at',
      'fetched_at',
      'fetch_status',
      'fetch_attempts',
      'fetch_http_status',
      'fetch_error',
      'freshness_status',
      'freshness_reason',
      'extraction_status',
      'rewrite_status',
      'rewrite_attempts',
      'rewrite_error',
      'rewrite_started_at',
      'rewrite_finished_at',
      'rewritten_article_id',
      'source_track',
      'focused_game_id',
      'focused_source_id',
      'detected_update_type',
      'focused_confidence',
    ],
  },
  {
    name: 'news_sources',
    requiredColumns: [
      'id',
      'name',
      'domain',
      'rss_url',
      'homepage_url',
      'supports_rss',
      'supports_scraping',
      'blocked_count',
      'last_failure_at',
      'last_success_at',
    ],
    recommendedColumns: ['sitemap_url', 'site_url', 'url'],
  },
  {
    name: 'categories',
    requiredColumns: ['id', 'name', 'icon', 'slug', 'description', 'sort_order'],
  },
  {
    name: 'focused_games',
    requiredColumns: [
      'id',
      'name',
      'slug',
      'category',
      'platforms',
      'official_website',
      'status',
      'priority',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'focused_game_sources',
    requiredColumns: [
      'id',
      'game_id',
      'source_type',
      'source_name',
      'source_url',
      'trust_level',
      'check_frequency',
      'enabled',
      'last_checked_at',
      'last_success_at',
      'last_error',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'games',
    requiredColumns: ['id', 'name', 'slug', 'thumbnail', 'platform', 'created_at'],
  },
];

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing required environment variables.');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY can be used as a fallback, but RLS may affect results.');
    process.exit(1);
  }

  if (USING_ANON_KEY) {
    console.warn('Warning: using NEXT_PUBLIC_SUPABASE_ANON_KEY because SUPABASE_SERVICE_ROLE_KEY is not set.');
    console.warn('RLS or permissions may cause false failures. Prefer SUPABASE_SERVICE_ROLE_KEY for schema verification.');
  }

  console.log('Checking Supabase schema contract...');
  console.log(`Project: ${SUPABASE_URL}`);

  const results = [];

  for (const table of REQUIRED_TABLES) {
    results.push(await verifyTable(table));
  }

  const failed = results.filter((result) => !result.ok);
  const warnings = results.filter((result) => result.warningColumns.length > 0);
  const passed = results.length - failed.length;

  console.log('');
  console.log(`Schema check complete: ${passed}/${results.length} tables passed.`);

  if (warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    for (const result of warnings) {
      console.log(`- ${result.table}: recommended columns missing or inaccessible: ${result.warningColumns.join(', ')}`);
    }
  }

  if (failed.length > 0) {
    console.log('');
    console.log('Failures:');
    for (const result of failed) {
      console.log(`- ${result.table}: ${result.message}`);
      if (result.missingColumns.length > 0) {
        console.log(`  Missing or inaccessible columns: ${result.missingColumns.join(', ')}`);
      }
    }
    process.exit(1);
  }

  console.log('');
  console.log('Manual checks still required for indexes, constraints, RLS policies, and increment_view RPC.');
}

async function verifyTable(table) {
  const requiredColumns = table.requiredColumns || [];
  const recommendedColumns = table.recommendedColumns || [];
  const fullCheck = await checkSelect(table.name, requiredColumns);
  const warningColumns = await findMissingColumns(table.name, recommendedColumns);

  if (fullCheck.ok) {
    const warningSuffix = warningColumns.length > 0 ? `, ${warningColumns.length} recommended missing` : '';
    console.log(`OK ${table.name} (${requiredColumns.length} required columns${warningSuffix})`);
    return { ok: true, table: table.name, message: '', missingColumns: [], warningColumns };
  }

  const missingColumns = await findMissingColumns(table.name, requiredColumns);

  const message = fullCheck.message || 'table or columns are missing/inaccessible';
  console.log(`FAIL ${table.name} - ${message}`);

  return {
    ok: false,
    table: table.name,
    message,
    missingColumns,
    warningColumns,
  };
}

async function findMissingColumns(tableName, columns) {
  const missingColumns = [];

  for (const column of columns) {
    const columnCheck = await checkSelect(tableName, [column]);
    if (!columnCheck.ok) {
      missingColumns.push(column);
    }
  }

  return missingColumns;
}

async function checkSelect(tableName, columns) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}`);
  url.searchParams.set('select', columns.join(','));
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (response.ok) {
    return { ok: true, message: '' };
  }

  return { ok: false, message: await readErrorMessage(response) };
}

async function readErrorMessage(response) {
  const text = await response.text();

  if (!text) {
    return `HTTP ${response.status} ${response.statusText}`;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.hint || parsed.details || text;
  } catch {
    return text.slice(0, 240);
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

main().catch((error) => {
  console.error('Schema check failed unexpectedly.');
  console.error(error);
  process.exit(1);
});
