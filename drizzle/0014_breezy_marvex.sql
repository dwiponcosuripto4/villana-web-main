CREATE TABLE "villa_nearby_place" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"distance_km" numeric(5, 2) NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"place_type" varchar(100),
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "villa_nearby_place" ADD CONSTRAINT "villa_nearby_place_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;