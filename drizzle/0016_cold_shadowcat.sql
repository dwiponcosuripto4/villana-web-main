-- Migration: Normalize user table to use serial integer as primary key
-- This migration safely converts the user table from text-based IDs to integer IDs
-- while preserving all existing data and relationships.

BEGIN;

-- Phase 1: Add new columns
-- ========================

-- Add new integer ID column to user table
ALTER TABLE "user" ADD COLUMN "id_new" SERIAL;

-- Add new integer foreign key columns to all referencing tables
ALTER TABLE "session" ADD COLUMN "user_id_new" INTEGER;
ALTER TABLE "villa" ADD COLUMN "created_by_new" INTEGER;
ALTER TABLE "villa" ADD COLUMN "owner_id_new" INTEGER;
ALTER TABLE "saved_villa" ADD COLUMN "user_id_new" INTEGER;
ALTER TABLE "villa_report" ADD COLUMN "user_id_new" INTEGER;
ALTER TABLE "villa_report" ADD COLUMN "reviewed_by_new" INTEGER;
ALTER TABLE "villa_change_request" ADD COLUMN "user_id_new" INTEGER;
ALTER TABLE "villa_change_request" ADD COLUMN "reviewed_by_new" INTEGER;
ALTER TABLE "villa_ownership_claim" ADD COLUMN "user_id_new" INTEGER;
ALTER TABLE "villa_ownership_claim" ADD COLUMN "reviewed_by_new" INTEGER;
ALTER TABLE "villa_ownership" ADD COLUMN "user_id_new" INTEGER;
ALTER TABLE "villa_ownership" ADD COLUMN "transferred_to_new" INTEGER;
ALTER TABLE "villa_update_request" ADD COLUMN "owner_id_new" INTEGER;
ALTER TABLE "villa_update_request" ADD COLUMN "reviewed_by_new" INTEGER;

-- Phase 2: Create mapping and populate data
-- ==========================================

-- Create temporary table to store old ID to new ID mapping
CREATE TEMPORARY TABLE user_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id INTEGER NOT NULL
);

-- Populate mapping table with all existing users
INSERT INTO user_id_mapping (old_id, new_id)
SELECT id, id_new FROM "user";

-- Update all foreign key references using the mapping
-- session table
UPDATE "session"
SET user_id_new = m.new_id
FROM user_id_mapping m
WHERE "session".user_id = m.old_id;

-- villa table
UPDATE "villa"
SET created_by_new = m.new_id
FROM user_id_mapping m
WHERE "villa".created_by = m.old_id;

UPDATE "villa"
SET owner_id_new = m.new_id
FROM user_id_mapping m
WHERE "villa".owner_id = m.old_id;

-- saved_villa table
UPDATE "saved_villa"
SET user_id_new = m.new_id
FROM user_id_mapping m
WHERE "saved_villa".user_id = m.old_id;

-- villa_report table
UPDATE "villa_report"
SET user_id_new = m.new_id
FROM user_id_mapping m
WHERE "villa_report".user_id = m.old_id;

UPDATE "villa_report"
SET reviewed_by_new = m.new_id
FROM user_id_mapping m
WHERE "villa_report".reviewed_by = m.old_id;

-- villa_change_request table
UPDATE "villa_change_request"
SET user_id_new = m.new_id
FROM user_id_mapping m
WHERE "villa_change_request".user_id = m.old_id;

UPDATE "villa_change_request"
SET reviewed_by_new = m.new_id
FROM user_id_mapping m
WHERE "villa_change_request".reviewed_by = m.old_id;

-- villa_ownership_claim table
UPDATE "villa_ownership_claim"
SET user_id_new = m.new_id
FROM user_id_mapping m
WHERE "villa_ownership_claim".user_id = m.old_id;

UPDATE "villa_ownership_claim"
SET reviewed_by_new = m.new_id
FROM user_id_mapping m
WHERE "villa_ownership_claim".reviewed_by = m.old_id;

-- villa_ownership table
UPDATE "villa_ownership"
SET user_id_new = m.new_id
FROM user_id_mapping m
WHERE "villa_ownership".user_id = m.old_id;

UPDATE "villa_ownership"
SET transferred_to_new = m.new_id
FROM user_id_mapping m
WHERE "villa_ownership".transferred_to = m.old_id;

-- villa_update_request table
UPDATE "villa_update_request"
SET owner_id_new = m.new_id
FROM user_id_mapping m
WHERE "villa_update_request".owner_id = m.old_id;

UPDATE "villa_update_request"
SET reviewed_by_new = m.new_id
FROM user_id_mapping m
WHERE "villa_update_request".reviewed_by = m.old_id;

-- Phase 3: Drop old foreign key constraints
-- ==========================================

-- Drop all foreign key constraints that reference the old user.id
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fk";
ALTER TABLE "villa" DROP CONSTRAINT IF EXISTS "villa_created_by_user_id_fk";
ALTER TABLE "villa" DROP CONSTRAINT IF EXISTS "villa_owner_id_user_id_fk";
ALTER TABLE "saved_villa" DROP CONSTRAINT IF EXISTS "saved_villa_user_id_user_id_fk";
ALTER TABLE "villa_report" DROP CONSTRAINT IF EXISTS "villa_report_user_id_user_id_fk";
ALTER TABLE "villa_report" DROP CONSTRAINT IF EXISTS "villa_report_reviewed_by_user_id_fk";
ALTER TABLE "villa_change_request" DROP CONSTRAINT IF EXISTS "villa_change_request_user_id_user_id_fk";
ALTER TABLE "villa_change_request" DROP CONSTRAINT IF EXISTS "villa_change_request_reviewed_by_user_id_fk";
ALTER TABLE "villa_ownership_claim" DROP CONSTRAINT IF EXISTS "villa_ownership_claim_user_id_user_id_fk";
ALTER TABLE "villa_ownership_claim" DROP CONSTRAINT IF EXISTS "villa_ownership_claim_reviewed_by_user_id_fk";
ALTER TABLE "villa_ownership" DROP CONSTRAINT IF EXISTS "villa_ownership_user_id_user_id_fk";
ALTER TABLE "villa_ownership" DROP CONSTRAINT IF EXISTS "villa_ownership_transferred_to_user_id_fk";
ALTER TABLE "villa_update_request" DROP CONSTRAINT IF EXISTS "villa_update_request_owner_id_user_id_fk";
ALTER TABLE "villa_update_request" DROP CONSTRAINT IF EXISTS "villa_update_request_reviewed_by_user_id_fk";

-- Phase 4: Drop old primary key constraint and old columns
-- ==========================================================

-- Drop the old primary key constraint
ALTER TABLE "user" DROP CONSTRAINT "user_pkey";

-- Drop old columns from user table
ALTER TABLE "user" DROP COLUMN "id";

-- Drop old foreign key columns from all referencing tables
ALTER TABLE "session" DROP COLUMN "user_id";
ALTER TABLE "villa" DROP COLUMN "created_by";
ALTER TABLE "villa" DROP COLUMN "owner_id";
ALTER TABLE "saved_villa" DROP COLUMN "user_id";
ALTER TABLE "villa_report" DROP COLUMN "user_id";
ALTER TABLE "villa_report" DROP COLUMN "reviewed_by";
ALTER TABLE "villa_change_request" DROP COLUMN "user_id";
ALTER TABLE "villa_change_request" DROP COLUMN "reviewed_by";
ALTER TABLE "villa_ownership_claim" DROP COLUMN "user_id";
ALTER TABLE "villa_ownership_claim" DROP COLUMN "reviewed_by";
ALTER TABLE "villa_ownership" DROP COLUMN "user_id";
ALTER TABLE "villa_ownership" DROP COLUMN "transferred_to";
ALTER TABLE "villa_update_request" DROP COLUMN "owner_id";
ALTER TABLE "villa_update_request" DROP COLUMN "reviewed_by";

-- Phase 5: Rename new columns to original names
-- ==============================================

-- Rename new columns in user table
ALTER TABLE "user" RENAME COLUMN "id_new" TO "id";

-- Rename new foreign key columns to original names
ALTER TABLE "session" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "villa" RENAME COLUMN "created_by_new" TO "created_by";
ALTER TABLE "villa" RENAME COLUMN "owner_id_new" TO "owner_id";
ALTER TABLE "saved_villa" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "villa_report" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "villa_report" RENAME COLUMN "reviewed_by_new" TO "reviewed_by";
ALTER TABLE "villa_change_request" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "villa_change_request" RENAME COLUMN "reviewed_by_new" TO "reviewed_by";
ALTER TABLE "villa_ownership_claim" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "villa_ownership_claim" RENAME COLUMN "reviewed_by_new" TO "reviewed_by";
ALTER TABLE "villa_ownership" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "villa_ownership" RENAME COLUMN "transferred_to_new" TO "transferred_to";
ALTER TABLE "villa_update_request" RENAME COLUMN "owner_id_new" TO "owner_id";
ALTER TABLE "villa_update_request" RENAME COLUMN "reviewed_by_new" TO "reviewed_by";

-- Phase 6: Re-establish constraints and indexes
-- ==============================================

-- Add new primary key constraint to user table
ALTER TABLE "user" ADD PRIMARY KEY ("id");

-- Add NOT NULL constraints where required
ALTER TABLE "session" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "saved_villa" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "villa_report" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "villa_change_request" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "villa_ownership_claim" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "villa_ownership" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "villa_update_request" ALTER COLUMN "owner_id" SET NOT NULL;

-- Re-establish foreign key constraints
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id");
ALTER TABLE "villa" ADD CONSTRAINT "villa_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id");
ALTER TABLE "villa" ADD CONSTRAINT "villa_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id");
ALTER TABLE "saved_villa" ADD CONSTRAINT "saved_villa_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "villa_report" ADD CONSTRAINT "villa_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "villa_report" ADD CONSTRAINT "villa_report_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id");
ALTER TABLE "villa_change_request" ADD CONSTRAINT "villa_change_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "villa_change_request" ADD CONSTRAINT "villa_change_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id");
ALTER TABLE "villa_ownership_claim" ADD CONSTRAINT "villa_ownership_claim_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "villa_ownership_claim" ADD CONSTRAINT "villa_ownership_claim_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id");
ALTER TABLE "villa_ownership" ADD CONSTRAINT "villa_ownership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "villa_ownership" ADD CONSTRAINT "villa_ownership_transferred_to_user_id_fk" FOREIGN KEY ("transferred_to") REFERENCES "user"("id");
ALTER TABLE "villa_update_request" ADD CONSTRAINT "villa_update_request_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "villa_update_request" ADD CONSTRAINT "villa_update_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id");

-- Add indexes for performance (if not already present)
CREATE INDEX IF NOT EXISTS "idx_session_user_id" ON "session"("user_id");
CREATE INDEX IF NOT EXISTS "idx_villa_created_by" ON "villa"("created_by");
CREATE INDEX IF NOT EXISTS "idx_villa_owner_id" ON "villa"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_saved_villa_user_id" ON "saved_villa"("user_id");
CREATE INDEX IF NOT EXISTS "idx_villa_report_user_id" ON "villa_report"("user_id");
CREATE INDEX IF NOT EXISTS "idx_villa_report_reviewed_by" ON "villa_report"("reviewed_by");
CREATE INDEX IF NOT EXISTS "idx_villa_change_request_user_id" ON "villa_change_request"("user_id");
CREATE INDEX IF NOT EXISTS "idx_villa_change_request_reviewed_by" ON "villa_change_request"("reviewed_by");
CREATE INDEX IF NOT EXISTS "idx_villa_ownership_claim_user_id" ON "villa_ownership_claim"("user_id");
CREATE INDEX IF NOT EXISTS "idx_villa_ownership_claim_reviewed_by" ON "villa_ownership_claim"("reviewed_by");
CREATE INDEX IF NOT EXISTS "idx_villa_ownership_user_id" ON "villa_ownership"("user_id");
CREATE INDEX IF NOT EXISTS "idx_villa_ownership_transferred_to" ON "villa_ownership"("transferred_to");
CREATE INDEX IF NOT EXISTS "idx_villa_update_request_owner_id" ON "villa_update_request"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_villa_update_request_reviewed_by" ON "villa_update_request"("reviewed_by");

-- Verify the migration completed successfully
DO $$
BEGIN
    -- Check that all user records have integer IDs
    IF (SELECT COUNT(*) FROM "user" WHERE "id" IS NULL) > 0 THEN
        RAISE EXCEPTION 'Migration failed: Some users have NULL integer IDs';
    END IF;

    -- Check that all foreign key references are properly mapped
    IF (SELECT COUNT(*) FROM "session" WHERE "user_id" IS NULL) > 0 THEN
        RAISE EXCEPTION 'Migration failed: Some sessions have NULL user_id';
    END IF;

    RAISE NOTICE 'User table normalization migration completed successfully!';
END
$$;

COMMIT;