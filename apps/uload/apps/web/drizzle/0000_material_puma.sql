CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"plan_type" text DEFAULT 'free',
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"referer" text,
	"browser" text,
	"device_type" text,
	"os" text,
	"country" text,
	"city" text,
	"clicked_at" timestamp DEFAULT now() NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"vote_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_code" text NOT NULL,
	"custom_code" text,
	"original_url" text NOT NULL,
	"title" text,
	"description" text,
	"user_id" uuid,
	"is_active" boolean DEFAULT true,
	"password" text,
	"max_clicks" integer,
	"expires_at" timestamp,
	"click_count" integer DEFAULT 0,
	"qr_code_url" text,
	"tags" jsonb,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"account_owner" uuid,
	"workspace_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "links_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"owner" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shared_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" uuid NOT NULL,
	"user_id" uuid,
	"permissions" jsonb,
	"invitation_status" text DEFAULT 'pending',
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"icon" text,
	"is_public" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_auth_id" text,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"bio" text,
	"location" text,
	"website" text,
	"github" text,
	"twitter" text,
	"linkedin" text,
	"instagram" text,
	"public_profile" boolean DEFAULT false,
	"show_click_stats" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"default_expiry" integer,
	"profile_background" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_external_auth_id_unique" UNIQUE("external_auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"owner" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_feature_request_id_feature_requests_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_votes" ADD CONSTRAINT "feature_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_account_owner_accounts_id_fk" FOREIGN KEY ("account_owner") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_invitations" ADD CONSTRAINT "pending_invitations_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_invitations" ADD CONSTRAINT "pending_invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_access" ADD CONSTRAINT "shared_access_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_access" ADD CONSTRAINT "shared_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_owner_idx" ON "accounts" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "clicks_link_id_idx" ON "clicks" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "clicks_clicked_at_idx" ON "clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "clicks_country_idx" ON "clicks" USING btree ("country");--> statement-breakpoint
CREATE INDEX "feature_requests_user_id_idx" ON "feature_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feature_requests_status_idx" ON "feature_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feature_requests_vote_count_idx" ON "feature_requests" USING btree ("vote_count");--> statement-breakpoint
CREATE INDEX "feature_votes_feature_request_id_idx" ON "feature_votes" USING btree ("feature_request_id");--> statement-breakpoint
CREATE INDEX "feature_votes_user_id_idx" ON "feature_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feature_votes_unique_idx" ON "feature_votes" USING btree ("feature_request_id","user_id");--> statement-breakpoint
CREATE INDEX "folders_user_id_idx" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "link_tags_link_id_idx" ON "link_tags" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_tags_tag_id_idx" ON "link_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "link_tags_unique_idx" ON "link_tags" USING btree ("link_id","tag_id");--> statement-breakpoint
CREATE INDEX "links_user_id_idx" ON "links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "links_short_code_idx" ON "links" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX "links_workspace_id_idx" ON "links" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "links_account_owner_idx" ON "links" USING btree ("account_owner");--> statement-breakpoint
CREATE INDEX "links_is_active_idx" ON "links" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "pending_invitations_email_idx" ON "pending_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pending_invitations_token_idx" ON "pending_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "pending_invitations_owner_idx" ON "pending_invitations" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "shared_access_owner_idx" ON "shared_access" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "shared_access_user_id_idx" ON "shared_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shared_access_status_idx" ON "shared_access" USING btree ("invitation_status");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_external_auth_id_idx" ON "users" USING btree ("external_auth_id");--> statement-breakpoint
CREATE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspaces_owner_idx" ON "workspaces" USING btree ("owner");