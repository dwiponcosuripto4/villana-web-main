CREATE TABLE IF NOT EXISTS "city" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"province_id" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "province" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-- --> statement-breakpoint
-- ALTER TABLE "villa" ADD COLUMN "province_id" varchar(10);--> statement-breakpoint
-- ALTER TABLE "villa" ADD COLUMN "city_id" varchar(10);--> statement-breakpoint
-- ALTER TABLE "city" ADD CONSTRAINT "city_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "villa" ADD CONSTRAINT "villa_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "villa" ADD CONSTRAINT "villa_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE no action ON UPDATE no action;
