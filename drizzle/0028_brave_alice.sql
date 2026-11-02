CREATE TYPE "public"."ota_provider" AS ENUM('agoda', 'traveloka', 'tiket_com', 'booking_com', 'airbnb', 'trip_com', 'expedia', 'other');--> statement-breakpoint
CREATE TYPE "public"."price_mode" AS ENUM('auto_fetch', 'manual', 'none');--> statement-breakpoint
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
ALTER TABLE "villa_ota_click" ADD CONSTRAINT "villa_ota_click_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_click" ADD CONSTRAINT "villa_ota_click_ota_link_id_villa_ota_link_id_fk" FOREIGN KEY ("ota_link_id") REFERENCES "public"."villa_ota_link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_click" ADD CONSTRAINT "villa_ota_click_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ota_link" ADD CONSTRAINT "villa_ota_link_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "villa_ota_click_villa_idx" ON "villa_ota_click" USING btree ("villa_id");--> statement-breakpoint
CREATE INDEX "villa_ota_click_ota_link_idx" ON "villa_ota_click" USING btree ("ota_link_id");--> statement-breakpoint
CREATE INDEX "villa_ota_click_provider_idx" ON "villa_ota_click" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "villa_ota_click_time_idx" ON "villa_ota_click" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "villa_ota_link_villa_idx" ON "villa_ota_link" USING btree ("villa_id");--> statement-breakpoint
CREATE INDEX "villa_ota_link_provider_idx" ON "villa_ota_link" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "villa_ota_link_active_idx" ON "villa_ota_link" USING btree ("villa_id","is_active");