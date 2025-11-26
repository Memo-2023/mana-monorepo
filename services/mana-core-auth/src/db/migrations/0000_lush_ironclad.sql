CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "credits";
--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'service');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'usage', 'refund', 'bonus', 'expiry', 'adjustment');--> statement-breakpoint
CREATE TABLE "auth"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."passwords" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"hashed_password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"refresh_token_expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_id" text,
	"device_name" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "sessions_token_unique" UNIQUE("token"),
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "auth"."two_factor_auth" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"backup_codes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"enabled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth"."verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "credits"."balances" (
	"user_id" uuid PRIMARY KEY NOT NULL,
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
CREATE TABLE "credits"."packages" (
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
CREATE TABLE "credits"."purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
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
CREATE TABLE "credits"."transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"app_id" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "credits"."usage_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"app_id" text NOT NULL,
	"credits_used" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."passwords" ADD CONSTRAINT "passwords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits"."balances" ADD CONSTRAINT "balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits"."purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits"."purchases" ADD CONSTRAINT "purchases_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "credits"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits"."transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits"."usage_stats" ADD CONSTRAINT "usage_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchases_user_id_idx" ON "credits"."purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "purchases_stripe_payment_intent_id_idx" ON "credits"."purchases" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "credits"."transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_app_id_idx" ON "credits"."transactions" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "credits"."transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_idempotency_key_idx" ON "credits"."transactions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "usage_stats_user_id_date_idx" ON "credits"."usage_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "usage_stats_app_id_date_idx" ON "credits"."usage_stats" USING btree ("app_id","date");