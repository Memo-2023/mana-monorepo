CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "credits";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "feedback";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "referrals";
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'service'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'usage', 'refund', 'bonus', 'expiry', 'adjustment'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."feedback_category" AS ENUM('bug', 'feature', 'improvement', 'question', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."feedback_status" AS ENUM('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."bonus_event_type" AS ENUM('registered', 'activated', 'qualified', 'retained', 'cross_app'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."bonus_status" AS ENUM('pending', 'paid', 'held', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."fraud_pattern_type" AS ENUM('email_domain', 'ip_range', 'device_pattern'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."fraud_severity" AS ENUM('low', 'medium', 'high', 'critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."referral_code_type" AS ENUM('auto', 'custom', 'campaign'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."referral_status" AS ENUM('registered', 'activated', 'qualified', 'retained'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."referral_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected', 'escalated'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."passwords" (
	"user_id" text PRIMARY KEY NOT NULL,
	"hashed_password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"event_type" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp with time zone,
	"device_id" text,
	"device_name" text,
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone,
	"remember_me" boolean DEFAULT false,
	CONSTRAINT "sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."two_factor_auth" (
	"user_id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"backup_codes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"enabled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"global_settings" jsonb DEFAULT '{"nav":{"desktopPosition":"top","sidebarCollapsed":false},"theme":{"mode":"system","colorScheme":"ocean"},"locale":"de"}'::jsonb NOT NULL,
	"app_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"device_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."balances" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"free_credits_remaining" integer DEFAULT 150 NOT NULL,
	"daily_free_credits" integer DEFAULT 5 NOT NULL,
	"last_daily_reset_at" timestamp with time zone DEFAULT now(),
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."credit_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"amount" integer NOT NULL,
	"allocated_by" text NOT NULL,
	"reason" text,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."organization_balances" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"allocated_credits" integer DEFAULT 0 NOT NULL,
	"available_credits" integer DEFAULT 0 NOT NULL,
	"total_purchased" integer DEFAULT 0 NOT NULL,
	"total_allocated" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"price_euro_cents" integer NOT NULL,
	"stripe_price_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"package_id" uuid,
	"credits" integer NOT NULL,
	"price_euro_cents" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "purchases_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"app_id" text NOT NULL,
	"description" text NOT NULL,
	"organization_id" text,
	"metadata" jsonb,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credits"."usage_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"app_id" text NOT NULL,
	"credits_used" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback"."feedback_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feedback_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback"."user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"app_id" text NOT NULL,
	"title" text,
	"feedback_text" text NOT NULL,
	"category" "feedback_category" DEFAULT 'feature' NOT NULL,
	"status" "feedback_status" DEFAULT 'submitted' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"admin_response" text,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"device_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."bonus_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"event_type" "bonus_event_type" NOT NULL,
	"app_id" text,
	"credits_base" integer NOT NULL,
	"tier_multiplier" real DEFAULT 1 NOT NULL,
	"credits_final" integer NOT NULL,
	"tier_at_time" "referral_tier" NOT NULL,
	"transaction_id" uuid,
	"status" "bonus_status" DEFAULT 'pending' NOT NULL,
	"hold_reason" text,
	"hold_until" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"type" "referral_code_type" DEFAULT 'auto' NOT NULL,
	"source_app_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"expires_at" timestamp with time zone,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."cross_app_activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"app_id" text NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bonus_paid" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cross_app_relationship_app_unique" UNIQUE("relationship_id","app_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"app_id" text,
	"registrations" integer DEFAULT 0 NOT NULL,
	"activations" integer DEFAULT 0 NOT NULL,
	"qualifications" integer DEFAULT 0 NOT NULL,
	"retentions" integer DEFAULT 0 NOT NULL,
	"credits_paid" integer DEFAULT 0 NOT NULL,
	"credits_held" integer DEFAULT 0 NOT NULL,
	"fraud_blocked" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_stats_date_app_unique" UNIQUE("date","app_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_hash" text NOT NULL,
	"ip_type" text DEFAULT 'unknown' NOT NULL,
	"ip_country" text,
	"ip_asn" text,
	"device_hash" text,
	"user_agent_hash" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registration_count" integer DEFAULT 0 NOT NULL,
	"flagged_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "fingerprints_ip_device_unique" UNIQUE("ip_hash","device_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."fraud_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern_type" "fraud_pattern_type" NOT NULL,
	"pattern_value" text NOT NULL,
	"severity" "fraud_severity" DEFAULT 'medium' NOT NULL,
	"score_impact" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"identifier_type" text NOT NULL,
	"action" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"window_end" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"code_id" uuid NOT NULL,
	"source_app_id" text,
	"status" "referral_status" DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"qualified_at" timestamp with time zone,
	"retained_at" timestamp with time zone,
	"fraud_score" integer DEFAULT 0 NOT NULL,
	"fraud_signals" text,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "relationships_referee_id_unique" UNIQUE("referee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"fraud_score" integer NOT NULL,
	"fraud_signals" text NOT NULL,
	"priority" "fraud_severity" DEFAULT 'medium' NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"assigned_to" text,
	"notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."user_fingerprints" (
	"user_id" text NOT NULL,
	"fingerprint_id" uuid NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"context" text,
	CONSTRAINT "user_fingerprints_pk" UNIQUE("user_id","fingerprint_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referrals"."user_tiers" (
	"user_id" text PRIMARY KEY NOT NULL,
	"tier" "referral_tier" DEFAULT 'bronze' NOT NULL,
	"qualified_count" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#3B82F6',
	"icon" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."passwords" ADD CONSTRAINT "passwords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."balances" ADD CONSTRAINT "balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."credit_allocations" ADD CONSTRAINT "credit_allocations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."credit_allocations" ADD CONSTRAINT "credit_allocations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."credit_allocations" ADD CONSTRAINT "credit_allocations_allocated_by_users_id_fk" FOREIGN KEY ("allocated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."organization_balances" ADD CONSTRAINT "organization_balances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."purchases" ADD CONSTRAINT "purchases_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "credits"."packages"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."transactions" ADD CONSTRAINT "transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "credits"."usage_stats" ADD CONSTRAINT "usage_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "feedback"."feedback_votes" ADD CONSTRAINT "feedback_votes_feedback_id_user_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "feedback"."user_feedback"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "feedback"."feedback_votes" ADD CONSTRAINT "feedback_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "feedback"."user_feedback" ADD CONSTRAINT "user_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "auth"."members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organizations"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."bonus_events" ADD CONSTRAINT "bonus_events_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "referrals"."relationships"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."bonus_events" ADD CONSTRAINT "bonus_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."codes" ADD CONSTRAINT "codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."cross_app_activations" ADD CONSTRAINT "cross_app_activations_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "referrals"."relationships"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."relationships" ADD CONSTRAINT "relationships_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."relationships" ADD CONSTRAINT "relationships_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."relationships" ADD CONSTRAINT "relationships_code_id_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "referrals"."codes"("id") ON DELETE restrict ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."review_queue" ADD CONSTRAINT "review_queue_relationship_id_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "referrals"."relationships"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."user_fingerprints" ADD CONSTRAINT "user_fingerprints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."user_fingerprints" ADD CONSTRAINT "user_fingerprints_fingerprint_id_fingerprints_id_fk" FOREIGN KEY ("fingerprint_id") REFERENCES "referrals"."fingerprints"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "referrals"."user_tiers" ADD CONSTRAINT "user_tiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "auth"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_allocations_organization_id_idx" ON "credits"."credit_allocations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_allocations_employee_id_idx" ON "credits"."credit_allocations" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_allocations_allocated_by_idx" ON "credits"."credit_allocations" USING btree ("allocated_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_allocations_created_at_idx" ON "credits"."credit_allocations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_user_id_idx" ON "credits"."purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_stripe_payment_intent_id_idx" ON "credits"."purchases" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "credits"."transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_app_id_idx" ON "credits"."transactions" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_organization_id_idx" ON "credits"."transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "credits"."transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_idempotency_key_idx" ON "credits"."transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_stats_user_id_date_idx" ON "credits"."usage_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_stats_app_id_date_idx" ON "credits"."usage_stats" USING btree ("app_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "feedback_vote_unique" ON "feedback"."feedback_votes" USING btree ("feedback_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_votes_feedback_idx" ON "feedback"."feedback_votes" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_user_idx" ON "feedback"."user_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_app_idx" ON "feedback"."user_feedback" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_public_idx" ON "feedback"."user_feedback" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback"."user_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback"."user_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_organization_id_idx" ON "auth"."invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "auth"."invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "auth"."invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_organization_id_idx" ON "auth"."members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_user_id_idx" ON "auth"."members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "members_organization_user_idx" ON "auth"."members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "auth"."organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_events_relationship_idx" ON "referrals"."bonus_events" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_events_user_idx" ON "referrals"."bonus_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_events_status_idx" ON "referrals"."bonus_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_events_event_type_idx" ON "referrals"."bonus_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "codes_lookup_idx" ON "referrals"."codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "codes_user_idx" ON "referrals"."codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "codes_active_idx" ON "referrals"."codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cross_app_relationship_idx" ON "referrals"."cross_app_activations" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_stats_date_app_idx" ON "referrals"."daily_stats" USING btree ("date","app_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fingerprints_ip_hash_idx" ON "referrals"."fingerprints" USING btree ("ip_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fingerprints_device_hash_idx" ON "referrals"."fingerprints" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fraud_patterns_active_idx" ON "referrals"."fraud_patterns" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fraud_patterns_type_idx" ON "referrals"."fraud_patterns" USING btree ("pattern_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_lookup_idx" ON "referrals"."rate_limits" USING btree ("identifier","identifier_type","action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_window_idx" ON "referrals"."rate_limits" USING btree ("window_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_referrer_idx" ON "referrals"."relationships" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_referee_idx" ON "referrals"."relationships" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_status_idx" ON "referrals"."relationships" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_flagged_idx" ON "referrals"."relationships" USING btree ("is_flagged");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "relationships_code_idx" ON "referrals"."relationships" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_queue_status_priority_idx" ON "referrals"."review_queue" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_queue_relationship_idx" ON "referrals"."review_queue" USING btree ("relationship_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_fingerprints_user_idx" ON "referrals"."user_fingerprints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_fingerprints_fingerprint_idx" ON "referrals"."user_fingerprints" USING btree ("fingerprint_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_user_idx" ON "tags" USING btree ("user_id");