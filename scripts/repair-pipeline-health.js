const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APPLY = process.argv.includes('--apply');
const LIMIT = 100;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing required environment variables.');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: queueRows, error } = await supabase
    .from('raw_news_queue')
    .select('id,source_url,rewrite_status,rewritten_article_id,rewrite_finished_at')
    .eq('rewrite_status', 'success')
    .is('rewritten_article_id', null)
    .not('source_url', 'is', null)
    .limit(LIMIT);

  if (error) {
    throw new Error(`LOAD_QUEUE_FAILED: ${error.message}`);
  }

  const repairs = [];

  for (const row of queueRows || []) {
    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .select('id,source_url,published_at,created_at')
      .eq('source_url', row.source_url)
      .order('published_at', { ascending: false })
      .limit(1);

    if (articleError) {
      throw new Error(`LOAD_ARTICLE_FAILED: ${articleError.message}`);
    }

    const article = articles?.[0];
    if (!article) continue;

    repairs.push({
      queueId: row.id,
      articleId: article.id,
      sourceUrl: row.source_url,
      rewriteFinishedAt: row.rewrite_finished_at || article.published_at || article.created_at || new Date().toISOString(),
    });
  }

  console.log(JSON.stringify({ apply: APPLY, found: queueRows?.length || 0, repairable: repairs.length, repairs }, null, 2));

  if (!APPLY || repairs.length === 0) return;

  for (const repair of repairs) {
    const { error: updateError } = await supabase
      .from('raw_news_queue')
      .update({
        rewritten_article_id: repair.articleId,
        rewrite_finished_at: repair.rewriteFinishedAt,
      })
      .eq('id', repair.queueId)
      .eq('rewrite_status', 'success')
      .is('rewritten_article_id', null);

    if (updateError) {
      throw new Error(`REPAIR_QUEUE_FAILED:${repair.queueId}: ${updateError.message}`);
    }
  }

  console.log(`Applied ${repairs.length} repairs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
