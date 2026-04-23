/**
 * Persona infrastructure — schemas backing the M2 phase of the
 * MCP/Personas plan (`docs/plans/mana-mcp-and-personas.md`).
 *
 * A Persona is a real Mana user (`auth.users` row, `kind = 'persona'`)
 * with extra metadata describing how the persona-runner should drive it:
 * archetype, system prompt, module mix, tick cadence. Test-infrastructure
 * concern — runs in dev/staging today, may be enabled in prod once the
 * runner has settled.
 *
 * Three tables, all in the `auth` namespace because they're 1:1-coupled
 * to user lifecycle:
 *   - `personas`         — per-persona descriptor (1:1 with users)
 *   - `persona_actions`  — audit trail of every tool call the runner made
 *   - `persona_feedback` — structured 1–5 ratings the runner emits per tick
 *
 * Why `auth.*` rather than `platform.*`: personas extend users, the FK
 * lives here, and mana-auth is the natural CRUD owner. Cross-schema
 * joins for nothing.
 */

import { jsonb, integer, smallint, text, timestamp, index } from 'drizzle-orm/pg-core';
import { authSchema, users } from './auth';

// ─── personas ─────────────────────────────────────────────────────

export const personas = authSchema.table(
	'personas',
	{
		userId: text('user_id')
			.primaryKey()
			.references(() => users.id, { onDelete: 'cascade' }),

		/**
		 * Short stable identifier for the persona's behavioural profile,
		 * e.g. `'adhd-student'`, `'ceo-busy'`, `'creative-parent'`. Used
		 * by analytics to bucket actions/feedback across personas of the
		 * same archetype.
		 */
		archetype: text('archetype').notNull(),

		/**
		 * Long-form system prompt for the persona-runner. Includes
		 * demographics, motivations, current life context — whatever the
		 * Claude SDK call should treat as "this is who you are when you
		 * use Mana today".
		 */
		systemPrompt: text('system_prompt').notNull(),

		/**
		 * Hint to the runner about which modules the persona reaches for.
		 * Shape: `{ todo: 0.3, journal: 0.3, notes: 0.4 }` — relative
		 * weights, not strict probabilities. The runner is free to ignore
		 * this if Claude decides differently in the moment.
		 */
		moduleMix: jsonb('module_mix').notNull(),

		/**
		 * How often the runner should give this persona a turn.
		 *   `daily`    — every day around the persona's "tick window"
		 *   `weekdays` — Mon–Fri only
		 *   `hourly`   — every hour (used for high-frequency stress tests)
		 */
		tickCadence: text('tick_cadence').notNull().default('daily'),

		lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('personas_archetype_idx').on(table.archetype)]
);

// ─── persona_actions ──────────────────────────────────────────────

export const personaActions = authSchema.table(
	'persona_actions',
	{
		id: text('id').primaryKey(),
		personaId: text('persona_id')
			.notNull()
			.references(() => personas.userId, { onDelete: 'cascade' }),

		/**
		 * Groups every tool call within a single runner tick. Lets the
		 * dashboard show "Anna's Tuesday session: created 2 todos,
		 * read 3 articles, wrote 1 journal entry".
		 */
		tickId: text('tick_id').notNull(),

		toolName: text('tool_name').notNull(),

		/**
		 * SHA-256 of the JSON-stringified input. Lets analytics dedupe
		 * "the same tool with the same args was called N times across
		 * personas this week" without reconstructing inputs from the
		 * (potentially large, potentially encrypted) raw values.
		 */
		inputHash: text('input_hash'),

		/** `'ok'` on success, `'error'` on any thrown handler exception. */
		result: text('result').notNull(),
		errorMessage: text('error_message'),

		latencyMs: integer('latency_ms'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('persona_actions_persona_idx').on(table.personaId, table.createdAt),
		index('persona_actions_tick_idx').on(table.tickId),
	]
);

// ─── persona_feedback ─────────────────────────────────────────────

export const personaFeedback = authSchema.table(
	'persona_feedback',
	{
		id: text('id').primaryKey(),
		personaId: text('persona_id')
			.notNull()
			.references(() => personas.userId, { onDelete: 'cascade' }),

		tickId: text('tick_id').notNull(),

		/** Module the rating applies to (e.g. `'todo'`, `'journal'`). */
		module: text('module').notNull(),

		/**
		 * 1–5. The runner asks Claude (in-character as the persona) to
		 * rate the modules they used in this tick. SMALLINT is enough
		 * range and signals to readers that the value is bounded.
		 */
		rating: smallint('rating').notNull(),

		/** Free-text follow-up. May be German since most personas speak it. */
		notes: text('notes'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('persona_feedback_module_idx').on(table.module, table.createdAt),
		index('persona_feedback_persona_idx').on(table.personaId, table.createdAt),
	]
);
