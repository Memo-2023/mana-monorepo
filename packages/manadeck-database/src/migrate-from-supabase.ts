/**
 * Migration script to move data from Supabase to the new PostgreSQL database
 *
 * Prerequisites:
 * 1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 * 2. Set DATABASE_URL for the new PostgreSQL database
 * 3. Run migrations on the new database first: pnpm db:migrate
 *
 * Usage:
 * SUPABASE_URL=... SUPABASE_SERVICE_KEY=... DATABASE_URL=... tsx src/migrate-from-supabase.ts
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getDb, closeDb } from './client';
import {
  decks,
  cards,
  studySessions,
  cardProgress,
  deckTemplates,
  aiGenerations,
  userStats,
  dailyProgress,
} from './schema';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
const db = getDb();

interface MigrationStats {
  table: string;
  migrated: number;
  errors: number;
}

const stats: MigrationStats[] = [];

async function migrateTable<T>(
  tableName: string,
  supabaseTableName: string,
  drizzleTable: any,
  transformer: (row: any) => T
) {
  console.log(`\nMigrating ${tableName}...`);
  let migrated = 0;
  let errors = 0;

  try {
    // Fetch all data from Supabase
    const { data, error } = await supabase.from(supabaseTableName).select('*');

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      stats.push({ table: tableName, migrated: 0, errors: 1 });
      return;
    }

    if (!data || data.length === 0) {
      console.log(`No data found in ${tableName}`);
      stats.push({ table: tableName, migrated: 0, errors: 0 });
      return;
    }

    console.log(`Found ${data.length} rows in ${tableName}`);

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const transformed = batch.map(transformer);

      try {
        await db.insert(drizzleTable).values(transformed).onConflictDoNothing();
        migrated += batch.length;
        process.stdout.write(`\r  Migrated ${migrated}/${data.length} rows`);
      } catch (err) {
        console.error(`\n  Error inserting batch:`, err);
        errors += batch.length;
      }
    }

    console.log(`\n  Completed: ${migrated} migrated, ${errors} errors`);
  } catch (err) {
    console.error(`Error migrating ${tableName}:`, err);
    errors++;
  }

  stats.push({ table: tableName, migrated, errors });
}

async function main() {
  console.log('=== ManaDeck Data Migration ===');
  console.log('From: Supabase');
  console.log('To: PostgreSQL (Drizzle)');
  console.log('==============================\n');

  try {
    // 1. Migrate decks
    await migrateTable('decks', 'decks', decks, (row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      isPublic: row.is_public ?? false,
      isFeatured: row.is_featured ?? false,
      featuredAt: row.featured_at ? new Date(row.featured_at) : null,
      settings: row.settings ?? {},
      tags: row.tags ?? [],
      metadata: row.metadata ?? {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // 2. Migrate cards
    await migrateTable('cards', 'cards', cards, (row) => ({
      id: row.id,
      deckId: row.deck_id,
      position: row.position ?? 0,
      title: row.title,
      content: row.content,
      cardType: row.card_type,
      aiModel: row.ai_model,
      aiPrompt: row.ai_prompt,
      version: row.version ?? 1,
      isFavorite: row.is_favorite ?? false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // 3. Migrate study sessions
    await migrateTable('study_sessions', 'study_sessions', studySessions, (row) => ({
      id: row.id,
      deckId: row.deck_id,
      userId: row.user_id,
      mode: row.mode,
      totalCards: row.total_cards ?? 0,
      completedCards: row.completed_cards ?? 0,
      correctCards: row.correct_cards ?? 0,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      timeSpentSeconds: row.time_spent_seconds ?? 0,
    }));

    // 4. Migrate card progress
    await migrateTable('card_progress', 'card_progress', cardProgress, (row) => ({
      id: row.id,
      userId: row.user_id,
      cardId: row.card_id,
      easeFactor: row.ease_factor?.toString() ?? '2.5',
      interval: row.interval ?? 0,
      repetitions: row.repetitions ?? 0,
      lastReviewed: row.last_reviewed ? new Date(row.last_reviewed) : null,
      nextReview: row.next_review ? new Date(row.next_review) : null,
      status: row.status ?? 'new',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // 5. Migrate deck templates
    await migrateTable('deck_templates', 'deck_templates', deckTemplates, (row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      templateData: row.template_data ?? { cards: [] },
      isActive: row.is_active ?? true,
      isPublic: row.is_public ?? true,
      popularity: row.popularity ?? 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // 6. Migrate AI generations
    await migrateTable('ai_generations', 'ai_generations', aiGenerations, (row) => ({
      id: row.id,
      userId: row.user_id,
      deckId: row.deck_id,
      functionName: row.function_name,
      prompt: row.prompt,
      model: row.model,
      status: row.status ?? 'pending',
      metadata: row.metadata ?? {},
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at),
    }));

    // 7. Migrate user stats
    await migrateTable('user_stats', 'user_stats', userStats, (row) => ({
      userId: row.user_id,
      totalWins: row.total_wins ?? 0,
      totalSessions: row.total_sessions ?? 0,
      totalCardsStudied: row.total_cards_studied ?? 0,
      totalTimeSeconds: row.total_time_seconds ?? 0,
      averageAccuracy: row.average_accuracy?.toString() ?? '0',
      streakDays: row.streak_days ?? 0,
      longestStreak: row.longest_streak ?? 0,
      lastStudyDate: row.last_study_date,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    // Print summary
    console.log('\n\n=== Migration Summary ===');
    console.log('-------------------------');
    let totalMigrated = 0;
    let totalErrors = 0;
    for (const stat of stats) {
      console.log(`${stat.table}: ${stat.migrated} migrated, ${stat.errors} errors`);
      totalMigrated += stat.migrated;
      totalErrors += stat.errors;
    }
    console.log('-------------------------');
    console.log(`Total: ${totalMigrated} rows migrated, ${totalErrors} errors`);

    if (totalErrors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
