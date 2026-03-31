#!/usr/bin/env ts-node

/**
 * Script to analyze and standardize audio path field usage in Memoro production database
 *
 * STANDARDIZATION GOAL:
 * - Standardize all backend services to use 'audio_path' field consistently
 * - Handle legacy 'path' field references for backward compatibility
 * - Migrate any remaining 'path' fields to 'audio_path' in database
 *
 * CURRENT STATUS (August 25, 2025):
 * - Most memos already use 'audio_path' field (92%)
 * - Small subset uses legacy 'path' field (7.3%)
 * - Backend services now standardized to use 'audio_path'
 *
 * MIGRATION APPROACH:
 * - Update backend services to prioritize 'audio_path' over 'path'
 * - Migrate database records from 'path' to 'audio_path'
 * - Maintain backward compatibility during transition
 *
 * SQL QUERIES USED:
 */

// Query 1: Overall statistics
const overallStatsQuery = `
SELECT 
  COUNT(*) FILTER (WHERE source->>'audio_path' IS NOT NULL) as memos_with_audio_path,
  COUNT(*) FILTER (WHERE source->>'path' IS NOT NULL) as memos_with_path,
  COUNT(*) as total_memos,
  COUNT(*) FILTER (WHERE source->>'audio_path' IS NOT NULL AND source->>'path' IS NULL) as only_audio_path,
  COUNT(*) FILTER (WHERE source->>'audio_path' IS NOT NULL AND source->>'path' IS NOT NULL) as both_fields
FROM memos
WHERE source IS NOT NULL;
`;

// Query 2: Monthly breakdown
const monthlyBreakdownQuery = `
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) FILTER (WHERE source->>'audio_path' IS NOT NULL) as with_audio_path,
  COUNT(*) FILTER (WHERE source->>'path' IS NOT NULL) as with_path,
  COUNT(*) as total
FROM memos
WHERE source IS NOT NULL
GROUP BY month
ORDER BY month DESC
LIMIT 12;
`;

// Query 3: Daily breakdown for transition period
const dailyTransitionQuery = `
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) FILTER (WHERE source->>'audio_path' IS NOT NULL) as with_audio_path,
  COUNT(*) FILTER (WHERE source->>'path' IS NOT NULL) as with_path,
  COUNT(*) as total
FROM memos
WHERE source IS NOT NULL 
  AND created_at >= '2025-05-01'
  AND created_at < '2025-07-01'
GROUP BY day
ORDER BY day;
`;

// Migration query to standardize all memos to use 'audio_path' field
const migrationQuery = `
-- DRY RUN: Check what would be migrated from 'path' to 'audio_path'
SELECT 
  id,
  source->>'path' as current_path,
  source->>'audio_path' as current_audio_path,
  created_at
FROM memos
WHERE source->>'path' IS NOT NULL 
  AND source->>'audio_path' IS NULL
LIMIT 10;

-- ACTUAL MIGRATION (run with caution):
-- Migrate 'path' field to 'audio_path' field
-- UPDATE memos
-- SET source = jsonb_set(
--   source - 'path',
--   '{audio_path}', 
--   source->'path'
-- )
-- WHERE source->>'path' IS NOT NULL 
--   AND source->>'audio_path' IS NULL;
`;

console.log('Audio Path Field Analysis Script');
console.log('================================');
console.log('');
console.log('This script documents the analysis of the legacy audio_path field usage');
console.log('in the Memoro production database.');
console.log('');
console.log('Key Findings:');
console.log('- 92% of memos (16,223) already use the audio_path field');
console.log('- Only 7.3% (1,286) use the legacy path field');
console.log('- The fields are mutually exclusive (no memo has both)');
console.log('- Brief transition attempted in May-June 2025 but mostly reverted');
console.log('');
console.log('Backend Standardization Complete:');
console.log('- All backend services now standardized to use "audio_path" field');
console.log('- Legacy "path" field handling maintained for backward compatibility');
console.log('- Database migration needed for remaining 7.3% with "path" field');
console.log('- Edge Functions already use "audio_path" consistently');
