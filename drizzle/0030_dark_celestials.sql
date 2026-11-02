CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image" text,
	"featured_image_alt" varchar(255),
	"category_id" integer,
	"author_id" integer,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"meta_title" text,
	"meta_description" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "post_tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "villa_ota_click" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"ota_link_id" uuid NOT NULL,
	"provider" "ota_provider" NOT NULL,
	"user_id" integer,
	"user_ip" varchar(45),
	"user_agent" text,
	"referer" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villa_ota_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"provider" "ota_provider" NOT NULL,
	"affiliate_url" text NOT NULL,
	"custom_label" varchar(100),
	"price_mode" "price_mode" DEFAULT 'none' NOT NULL,
	"manual_price" numeric(12, 2),
	"fetched_price" numeric(12, 2),
	"price_currency" varchar(3) DEFAULT 'IDR',
	"price_updated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villa_other_villas_cache" (
	"villa_id" integer PRIMARY KEY NOT NULL,
	"other_villa_ids" integer[] NOT NULL,
	"distances" numeric(6, 2)[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "villa_ownership_claim" ADD COLUMN "verification_code" varchar(5);--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tag" ADD CONSTRAINT "post_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_click" ADD CONSTRAINT "villa_ota_click_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_click" ADD CONSTRAINT "villa_ota_click_ota_link_id_villa_ota_link_id_fk" FOREIGN KEY ("ota_link_id") REFERENCES "public"."villa_ota_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_click" ADD CONSTRAINT "villa_ota_click_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_link" ADD CONSTRAINT "villa_ota_link_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_other_villas_cache" ADD CONSTRAINT "villa_other_villas_cache_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_slug_idx" ON "post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_status_idx" ON "post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "post_category_idx" ON "post" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "post_published_at_idx" ON "post" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "post_author_idx" ON "post" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "post_tag_post_idx" ON "post_tag" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_tag_tag_idx" ON "post_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "tag_slug_idx" ON "tag" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "villa_ota_click_villa_idx" ON "villa_ota_click" USING btree ("villa_id");--> statement-breakpoint
CREATE INDEX "villa_ota_click_ota_link_idx" ON "villa_ota_click" USING btree ("ota_link_id");--> statement-breakpoint
CREATE INDEX "villa_ota_click_provider_idx" ON "villa_ota_click" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "villa_ota_click_time_idx" ON "villa_ota_click" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "villa_ota_link_villa_idx" ON "villa_ota_link" USING btree ("villa_id");--> statement-breakpoint
CREATE INDEX "villa_ota_link_provider_idx" ON "villa_ota_link" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "villa_ota_link_active_idx" ON "villa_ota_link" USING btree ("villa_id","is_active");
