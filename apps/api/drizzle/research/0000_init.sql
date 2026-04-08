-- Research module — initial schema (manually authored to match
-- apps/api/src/modules/research/schema.ts).
--
-- Once `drizzle-kit` is installed in apps/api, future migrations should
-- be generated via `pnpm --filter @mana/api db:generate` and this file
-- can become the canonical baseline.
--
-- Apply with:
--   psql "$DATABASE_URL" -f apps/api/drizzle/research/0000_init.sql

CREATE SCHEMA IF NOT EXISTS "research";

CREATE TABLE IF NOT EXISTS "research"."research_results" (
	"id"                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id"             text        NOT NULL,
	"question_id"         text        NOT NULL,
	"depth"               text        NOT NULL,
	"status"              text        NOT NULL,
	"sub_queries"         jsonb,
	"summary"             text,
	"key_points"          jsonb,
	"follow_up_questions" jsonb,
	"error_message"       text,
	"started_at"          timestamptz NOT NULL DEFAULT now(),
	"finished_at"         timestamptz
);

CREATE INDEX IF NOT EXISTS "research_results_user_id_idx"
	ON "research"."research_results" ("user_id");

CREATE INDEX IF NOT EXISTS "research_results_question_id_idx"
	ON "research"."research_results" ("question_id");

CREATE TABLE IF NOT EXISTS "research"."sources" (
	"id"                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
	"research_result_id"   uuid        NOT NULL REFERENCES "research"."research_results"("id") ON DELETE CASCADE,
	"url"                  text        NOT NULL,
	"title"                text,
	"snippet"              text,
	"extracted_content"    text,
	"category"             text,
	"rank"                 integer     NOT NULL,
	"created_at"           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sources_research_result_id_idx"
	ON "research"."sources" ("research_result_id");
