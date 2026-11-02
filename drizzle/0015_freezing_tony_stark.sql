CREATE TYPE "public"."claim_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'appealed');--> statement-breakpoint
CREATE TYPE "public"."update_request_type" AS ENUM('immediate', 'pending_approval', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."villa_data_category" AS ENUM('basic_info', 'pricing', 'media', 'amenities', 'contact', 'technical');--> statement-breakpoint
CREATE TABLE "villa_ownership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"claim_id" uuid NOT NULL,
	"ownership_type" varchar(50) DEFAULT 'owner' NOT NULL,
	"verification_level" varchar(20) DEFAULT 'basic' NOT NULL,
	"can_edit_immediately" boolean DEFAULT true NOT NULL,
	"can_edit_pricing" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"transferred_at" timestamp with time zone,
	"transferred_to" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villa_ownership_villa_id_unique" UNIQUE("villa_id")
);
--> statement-breakpoint
CREATE TABLE "villa_ownership_claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"claim_reason" text NOT NULL,
	"ownership_proof" text,
	"contact_verification" text,
	"additional_info" text,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villa_update_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"owner_id" text NOT NULL,
	"update_type" "update_request_type" NOT NULL,
	"data_category" "villa_data_category" NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"current_value" text,
	"proposed_value" text NOT NULL,
	"change_reason" text,
	"status" "change_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"admin_notes" text,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "villa" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "villa_ownership" ADD CONSTRAINT "villa_ownership_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ownership" ADD CONSTRAINT "villa_ownership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ownership" ADD CONSTRAINT "villa_ownership_claim_id_villa_ownership_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."villa_ownership_claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ownership" ADD CONSTRAINT "villa_ownership_transferred_to_user_id_fk" FOREIGN KEY ("transferred_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ownership_claim" ADD CONSTRAINT "villa_ownership_claim_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ownership_claim" ADD CONSTRAINT "villa_ownership_claim_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_ownership_claim" ADD CONSTRAINT "villa_ownership_claim_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_update_request" ADD CONSTRAINT "villa_update_request_villa_id_villa_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_update_request" ADD CONSTRAINT "villa_update_request_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_update_request" ADD CONSTRAINT "villa_update_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa" ADD CONSTRAINT "villa_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;