CREATE TYPE "public"."generation_status" AS ENUM('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('image', 'text');--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_id" uuid,
	"source_image_id" uuid,
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"model" text,
	"style" text,
	"public_url" text,
	"storage_path" text NOT NULL,
	"filename" text NOT NULL,
	"format" text,
	"width" integer,
	"height" integer,
	"file_size" integer,
	"blurhash" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"rating" integer,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model_id" uuid,
	"batch_id" uuid,
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"model" text,
	"style" text,
	"source_image_url" text,
	"width" integer,
	"height" integer,
	"steps" integer,
	"guidance_scale" real,
	"seed" integer,
	"generation_strength" real,
	"status" "generation_status" DEFAULT 'pending' NOT NULL,
	"replicate_prediction_id" text,
	"error_message" text,
	"generation_time_seconds" integer,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"canvas_width" integer DEFAULT 2000 NOT NULL,
	"canvas_height" integer DEFAULT 1500 NOT NULL,
	"background_color" text DEFAULT '#ffffff' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"image_id" uuid,
	"item_type" "item_type" DEFAULT 'image' NOT NULL,
	"position_x" real DEFAULT 0 NOT NULL,
	"position_y" real DEFAULT 0 NOT NULL,
	"scale_x" real DEFAULT 1 NOT NULL,
	"scale_y" real DEFAULT 1 NOT NULL,
	"rotation" real DEFAULT 0 NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"opacity" real DEFAULT 1 NOT NULL,
	"width" integer,
	"height" integer,
	"text_content" text,
	"font_size" integer,
	"color" text,
	"properties" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"replicate_id" text NOT NULL,
	"version" text,
	"default_width" integer DEFAULT 1024,
	"default_height" integer DEFAULT 1024,
	"default_steps" integer DEFAULT 25,
	"default_guidance_scale" real DEFAULT 7.5,
	"min_width" integer DEFAULT 512,
	"min_height" integer DEFAULT 512,
	"max_width" integer DEFAULT 2048,
	"max_height" integer DEFAULT 2048,
	"max_steps" integer DEFAULT 50,
	"supports_negative_prompt" boolean DEFAULT true NOT NULL,
	"supports_img2img" boolean DEFAULT false NOT NULL,
	"supports_seed" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"cost_per_generation" real,
	"estimated_time_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
