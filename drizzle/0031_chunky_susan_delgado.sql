ALTER TABLE "post" ADD COLUMN "city_id" varchar(10);--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_city_id_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."city"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_city_idx" ON "post" USING btree ("city_id");