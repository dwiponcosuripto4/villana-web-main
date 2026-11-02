CREATE TABLE "villa_other_villas_cache" (
	"villa_id" integer PRIMARY KEY NOT NULL,
	"other_villa_ids" integer[] NOT NULL,
	"distances" numeric(6, 2)[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "villa_other_villas_cache" ADD CONSTRAINT "villa_other_villas_cache_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;