CREATE TYPE "public"."villa_button_click_type" AS ENUM('whatsapp_contact');--> statement-breakpoint
CREATE TABLE "villa_button_click" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"user_id" integer,
	"button_type" "villa_button_click_type" NOT NULL,
	"user_ip" varchar(45),
	"user_agent" text,
	"referer" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "villa" ADD COLUMN "whatsapp_clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "villa_button_click" ADD CONSTRAINT "villa_button_click_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_button_click" ADD CONSTRAINT "villa_button_click_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "villa_button_click_villa_idx" ON "villa_button_click" USING btree ("villa_id");--> statement-breakpoint
CREATE INDEX "villa_button_click_user_idx" ON "villa_button_click" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "villa_button_click_type_idx" ON "villa_button_click" USING btree ("button_type");--> statement-breakpoint
CREATE INDEX "villa_button_click_time_idx" ON "villa_button_click" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "villa_button_click_villa_type_idx" ON "villa_button_click" USING btree ("villa_id","button_type");