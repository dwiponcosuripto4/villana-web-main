/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'villa_last_update'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "villa_last_update" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
-- ALTER TABLE "villa_last_update" ALTER COLUMN "villa_id" DROP NOT NULL;--> statement-breakpoint
-- ALTER TABLE "villa_last_update" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
-- ALTER TABLE "villa_last_update" ADD COLUMN "updated_by" text;--> statement-breakpoint
-- ALTER TABLE "villa_last_update" ADD CONSTRAINT "villa_last_update_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
