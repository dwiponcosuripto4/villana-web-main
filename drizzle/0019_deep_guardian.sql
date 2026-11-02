CREATE TABLE "place_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"alt_text" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "place_image" ADD CONSTRAINT "place_image_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "place_image_place_idx" ON "place_image" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_image_order_idx" ON "place_image" USING btree ("place_id","order_index");