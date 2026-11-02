CREATE TABLE "place" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(100),
	"category" varchar(100),
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"address" text,
	"city_id" varchar(10),
	"province_id" varchar(10),
	"google_place_id" varchar(100),
	"google_rating" numeric(3, 2),
	"google_rating_count" integer,
	"google_maps_link" text,
	"main_image" text,
	"images" text[],
	"meta_title" text,
	"meta_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "villa_place" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"place_id" uuid NOT NULL,
	"distance_km" numeric(5, 2) NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"travel_time_minutes" integer,
	"notes" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_place" ADD CONSTRAINT "villa_place_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_place" ADD CONSTRAINT "villa_place_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "place_slug_idx" ON "place" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "place_location_idx" ON "place" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "place_city_idx" ON "place" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "place_type_idx" ON "place" USING btree ("type");--> statement-breakpoint
CREATE INDEX "villa_place_villa_idx" ON "villa_place" USING btree ("villa_id");--> statement-breakpoint
CREATE INDEX "villa_place_place_idx" ON "villa_place" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "villa_place_unique_idx" ON "villa_place" USING btree ("villa_id","place_id");