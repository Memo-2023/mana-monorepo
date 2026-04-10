CREATE SCHEMA "media";
--> statement-breakpoint
CREATE TABLE "media"."media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_hash" text NOT NULL,
	"original_name" text,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"original_key" text NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"width" integer,
	"height" integer,
	"format" text,
	"has_alpha" boolean,
	"exif_data" jsonb,
	"date_taken" timestamp with time zone,
	"camera_make" text,
	"camera_model" text,
	"focal_length" text,
	"aperture" text,
	"iso" integer,
	"exposure_time" text,
	"gps_latitude" text,
	"gps_longitude" text,
	"thumbnail_key" text,
	"medium_key" text,
	"large_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "media"."media_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"app" text NOT NULL,
	"source_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media"."media_thumbnails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"fit" text DEFAULT 'cover' NOT NULL,
	"format" text DEFAULT 'webp' NOT NULL,
	"quality" integer DEFAULT 80 NOT NULL,
	"storage_key" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media"."media_references" ADD CONSTRAINT "media_references_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media"."media_thumbnails" ADD CONSTRAINT "media_thumbnails_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_content_hash_idx" ON "media"."media" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "media_status_idx" ON "media"."media" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media"."media" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_date_taken_idx" ON "media"."media" USING btree ("date_taken");--> statement-breakpoint
CREATE INDEX "media_camera_idx" ON "media"."media" USING btree ("camera_make","camera_model");--> statement-breakpoint
CREATE INDEX "media_ref_media_id_idx" ON "media"."media_references" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "media_ref_user_id_idx" ON "media"."media_references" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_ref_app_idx" ON "media"."media_references" USING btree ("app");--> statement-breakpoint
CREATE INDEX "media_ref_user_app_idx" ON "media"."media_references" USING btree ("user_id","app");--> statement-breakpoint
CREATE INDEX "media_thumb_media_id_idx" ON "media"."media_thumbnails" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "media_thumb_params_idx" ON "media"."media_thumbnails" USING btree ("media_id","width","height","fit","format");