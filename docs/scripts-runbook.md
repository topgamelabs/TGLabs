# Scripts Runbook

Status date: 2026-05-20

This runbook classifies project scripts by production risk. Prefer read-only verification scripts first. Do not run mutating scripts against production unless the exact target, expected changes, and rollback plan are understood.

## Read-Only Verification

These scripts should not write database rows.

- `scripts/verify-schema.js`
  - Purpose: checks required Supabase tables and columns through REST.
  - Required env: `NEXT_PUBLIC_SUPABASE_URL`, preferably `SUPABASE_SERVICE_ROLE_KEY`.
- `scripts/verify-pipeline-health.js`
  - Purpose: checks queue invariants and recent duplicate risks.
  - Required env: `NEXT_PUBLIC_SUPABASE_URL`, preferably `SUPABASE_SERVICE_ROLE_KEY`.
- `scripts/verify-db.js`
  - Purpose: samples published article content shape.
  - Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `scripts/verify-migration.js`
  - Purpose: samples article migration/content status.
  - Required env: inspect script before use; legacy script.
- `scripts/check-bad.js`
  - Purpose: lists likely bad article content migrations.
  - Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `scripts/debug-samples.js`
  - Purpose: prints a few article content samples.
  - Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Dry-Run First

These scripts are designed to inspect first and only mutate when explicitly requested.

- `scripts/repair-pipeline-health.js`
  - Dry-run: `node scripts/repair-pipeline-health.js`
  - Apply: `node scripts/repair-pipeline-health.js --apply`
  - Purpose: repairs legacy successful rewrite queue rows missing `rewritten_article_id` when a matching article exists by `source_url`.
  - Required env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Mutates Production Data

These scripts can insert, update, delete, regenerate, or migrate content. Treat them as one-off operations and prefer running against staging first.

- `scripts/ai-regenerate.js`
- `scripts/ai-regen-full.js`
- `scripts/create-8-clean.js`
- `scripts/create-all-articles.js`
- `scripts/fix-duplicate-hero-images.ts`
- `scripts/migrate-to-json-blocks.js`
- `scripts/regenerate-bad-articles.js`
- `scripts/remigrate-bad.js`
- `scripts/test-patch.js`
- `scripts/test-patch2.js`
- `scripts/debug-patch.js`

Before running any mutating script:

1. Confirm the Supabase project URL.
2. Confirm whether the script deletes, inserts, patches, or calls AI.
3. Run a read-only verification script first where possible.
4. Capture the target row IDs or slugs.
5. Re-run `scripts/verify-schema.js` or `scripts/verify-pipeline-health.js` after the change if relevant.

## Notes

- Several legacy scripts contain mojibake text from earlier encoding issues. Do not use those strings as trusted editorial copy without review.
- Prefer adding new maintenance scripts with dry-run behavior by default.
- Prefer documenting one-off production repairs here instead of leaving intent only in chat history.
