const SUPABASE_URL = trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const USING_ANON_KEY = !process.env.SUPABASE_SERVICE_ROLE_KEY && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const STALE_PROCESSING_MINUTES = 45;
const SAMPLE_LIMIT = 1000;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing required environment variables.');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY can be used as a fallback, but RLS may affect results.');
    process.exit(1);
  }

  if (USING_ANON_KEY) {
    console.warn('Warning: using NEXT_PUBLIC_SUPABASE_ANON_KEY because SUPABASE_SERVICE_ROLE_KEY is not set.');
    console.warn('RLS or permissions may cause false failures. Prefer SUPABASE_SERVICE_ROLE_KEY for pipeline verification.');
  }

  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000).toISOString();
  const checks = [
    {
      name: 'rejected queue items should not remain rewrite-pending',
      query: {
        table: 'raw_news_queue',
        filters: [
          ['freshness_status', 'eq', 'rejected'],
          ['extraction_status', 'eq', 'pending'],
          ['rewrite_status', 'eq', 'pending'],
        ],
      },
    },
    {
      name: 'accepted rewrite-pending items should have fetched raw content',
      query: {
        table: 'raw_news_queue',
        filters: [
          ['fetch_status', 'eq', 'success'],
          ['freshness_status', 'eq', 'accepted'],
          ['extraction_status', 'eq', 'pending'],
          ['rewrite_status', 'eq', 'pending'],
          ['raw_content', 'is', 'null'],
        ],
      },
    },
    {
      name: 'processing rewrite jobs should have a start timestamp',
      query: {
        table: 'raw_news_queue',
        filters: [
          ['rewrite_status', 'eq', 'processing'],
          ['rewrite_started_at', 'is', 'null'],
        ],
      },
    },
    {
      name: `processing rewrite jobs should not be older than ${STALE_PROCESSING_MINUTES} minutes`,
      query: {
        table: 'raw_news_queue',
        filters: [
          ['rewrite_status', 'eq', 'processing'],
          ['rewrite_started_at', 'lt', staleCutoff],
        ],
      },
    },
  ];

  console.log('Checking editorial pipeline health invariants...');
  console.log(`Project: ${SUPABASE_URL}`);

  const results = [];

  for (const check of checks) {
    const count = await countRows(check.query);
    const ok = count === 0;
    results.push({ name: check.name, count, ok });
    console.log(`${ok ? 'OK' : 'FAIL'} ${check.name}: ${count}`);
  }

  const duplicateChecks = await runDuplicateChecks();
  for (const check of duplicateChecks) {
    results.push(check);
    console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.name}: ${check.count}`);
    if (!check.ok && check.samples.length > 0) {
      console.log(`  samples: ${check.samples.join(', ')}`);
    }
  }

  const failures = results.filter((result) => !result.ok);

  if (failures.length > 0) {
    console.log('');
    console.log('Pipeline health check failed.');
    for (const failure of failures) {
      console.log(`- ${failure.name}: ${failure.count}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('Pipeline health check passed.');
}

async function runDuplicateChecks() {
  const [queueRows, articleRows, terminalRows] = await Promise.all([
    fetchRows(
      'raw_news_queue',
      'id,source_url,raw_title,content_hash,freshness_status,rewrite_status',
      {
        limit: SAMPLE_LIMIT,
        order: ['discovered_at', 'desc'],
        filters: [
          ['rewrite_status', 'not.in', '(skipped,duplicate)'],
          ['source_url', 'not.is', 'null'],
        ],
      }
    ),
    fetchRows('articles', 'id,source_url,title,seo_title', {
      limit: SAMPLE_LIMIT,
      order: ['published_at', 'desc'],
      filters: [['source_url', 'not.is', 'null']],
    }),
    fetchRows('raw_news_queue', 'id,rewrite_status,rewrite_error,rewritten_article_id', {
      limit: SAMPLE_LIMIT,
      order: ['rewrite_finished_at', 'desc'],
      filters: [['rewrite_status', 'in', '(success,failed,duplicate,skipped)']],
    }),
  ]);

  const duplicateQueueUrls = findDuplicateValues(queueRows, (row) => normalizeUrl(row.source_url));
  const duplicateArticleUrls = findDuplicateValues(articleRows, (row) => normalizeUrl(row.source_url));
  const duplicateQueueTitles = findDuplicateValues(queueRows, (row) => normalizeTitle(row.raw_title));
  const duplicateArticleTitles = findDuplicateValues(articleRows, (row) => normalizeTitle(row.title) || normalizeTitle(row.seo_title));
  const duplicateQueueContent = findDuplicateValues(
    queueRows.filter((row) => row.freshness_status !== 'rejected'),
    (row) => row.content_hash
  );

  const successWithoutArticle = terminalRows.filter(
    (row) => row.rewrite_status === 'success' && !row.rewritten_article_id
  );
  const terminalWithoutReason = terminalRows.filter(
    (row) => ['failed', 'duplicate', 'skipped'].includes(row.rewrite_status) && !row.rewrite_error
  );

  return [
    toCheck('recent active queue source URLs should be unique', duplicateQueueUrls),
    toCheck('recent article source URLs should be unique', duplicateArticleUrls),
    toCheck('recent active queue normalized titles should be unique', duplicateQueueTitles),
    toCheck('recent article normalized titles should be unique', duplicateArticleTitles),
    toCheck('recent non-rejected queue content hashes should be unique', duplicateQueueContent),
    toCheck(
      'successful rewrite queue items should have rewritten_article_id',
      successWithoutArticle.map((row) => row.id)
    ),
    toCheck(
      'failed/skipped/duplicate rewrite queue items should have rewrite_error',
      terminalWithoutReason.map((row) => row.id)
    ),
  ];
}

async function countRows(query) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${query.table}`);
  url.searchParams.set('select', 'id');

  for (const [column, operator, value] of query.filters) {
    url.searchParams.append(column, `${operator}.${value}`);
  }

  const response = await fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'count=exact',
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const contentRange = response.headers.get('content-range') || '';
  const countText = contentRange.split('/')[1];
  const count = Number(countText);

  if (!Number.isFinite(count)) {
    throw new Error(`COUNT_PARSE_FAILED: ${contentRange || 'missing content-range header'}`);
  }

  return count;
}

async function fetchRows(table, select, options) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  url.searchParams.set('limit', String(options.limit || SAMPLE_LIMIT));

  if (options.order) {
    url.searchParams.set('order', `${options.order[0]}.${options.order[1]}`);
  }

  for (const [column, operator, value] of options.filters || []) {
    url.searchParams.append(column, `${operator}.${value}`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function findDuplicateValues(rows, getValue) {
  const counts = new Map();

  for (const row of rows) {
    const value = getValue(row);
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function toCheck(name, values) {
  return {
    name,
    count: values.length,
    ok: values.length === 0,
    samples: values.slice(0, 5),
  };
}

function normalizeUrl(value) {
  if (!value || typeof value !== 'string') return '';

  try {
    const parsed = new URL(value);
    parsed.hash = '';

    for (const key of Array.from(parsed.searchParams.keys())) {
      const lower = key.toLowerCase();
      if (lower.startsWith('utm_') || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(lower)) {
        parsed.searchParams.delete(key);
      }
    }

    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    return parsed.toString();
  } catch {
    return value.trim();
  }
}

function normalizeTitle(value) {
  if (!value || typeof value !== 'string') return '';

  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  console.error('Pipeline health check failed unexpectedly.');
  console.error(error);
  process.exit(1);
});
