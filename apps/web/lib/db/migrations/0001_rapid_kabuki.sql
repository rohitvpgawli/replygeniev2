CREATE TABLE "rc_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"provider" varchar(50) DEFAULT 'google' NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scope" text,
	"connected_by" integer NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"last_sync_at" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"draft_text" text NOT NULL,
	"word_count" integer NOT NULL,
	"char_count" integer NOT NULL,
	"risk_flags" jsonb,
	"generated_by" varchar(50) DEFAULT 'ai' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"edited_by" integer,
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rc_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"connection_id" integer NOT NULL,
	"google_location_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"phone_number" varchar(50),
	"website_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"sync_cursor" timestamp,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"reply_text" text NOT NULL,
	"posted_by" integer NOT NULL,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"google_reply_id" varchar(255),
	"google_update_time" timestamp,
	CONSTRAINT "rc_replies_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "rc_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"google_review_id" varchar(255) NOT NULL,
	"reviewer_name" varchar(255),
	"reviewer_profile_photo_url" text,
	"star_rating" integer NOT NULL,
	"comment" text,
	"review_create_time" timestamp NOT NULL,
	"review_update_time" timestamp,
	"replied" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rc_reviews_google_review_id_unique" UNIQUE("google_review_id")
);
--> statement-breakpoint
CREATE TABLE "rc_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"month" varchar(7) NOT NULL,
	"posts_count" integer DEFAULT 0 NOT NULL,
	"drafts_count" integer DEFAULT 0 NOT NULL,
	"quota_limit" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rc_usage_team_id_month_unique" UNIQUE("team_id","month")
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "brand_voice_guidance" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "contact_channel" varchar(255);--> statement-breakpoint
ALTER TABLE "rc_audit_logs" ADD CONSTRAINT "rc_audit_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_audit_logs" ADD CONSTRAINT "rc_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_connections" ADD CONSTRAINT "rc_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_connections" ADD CONSTRAINT "rc_connections_connected_by_users_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_drafts" ADD CONSTRAINT "rc_drafts_review_id_rc_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."rc_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_drafts" ADD CONSTRAINT "rc_drafts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_drafts" ADD CONSTRAINT "rc_drafts_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_locations" ADD CONSTRAINT "rc_locations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_locations" ADD CONSTRAINT "rc_locations_connection_id_rc_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."rc_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_replies" ADD CONSTRAINT "rc_replies_review_id_rc_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."rc_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_replies" ADD CONSTRAINT "rc_replies_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_replies" ADD CONSTRAINT "rc_replies_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_reviews" ADD CONSTRAINT "rc_reviews_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_reviews" ADD CONSTRAINT "rc_reviews_location_id_rc_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."rc_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_usage" ADD CONSTRAINT "rc_usage_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rc_audit_logs_team_id_timestamp_idx" ON "rc_audit_logs" USING btree ("team_id","timestamp");--> statement-breakpoint
CREATE INDEX "rc_locations_google_location_id_idx" ON "rc_locations" USING btree ("google_location_id");--> statement-breakpoint
CREATE INDEX "rc_locations_team_id_idx" ON "rc_locations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "rc_reviews_location_id_create_time_idx" ON "rc_reviews" USING btree ("location_id","review_create_time");--> statement-breakpoint
CREATE INDEX "rc_reviews_google_review_id_idx" ON "rc_reviews" USING btree ("google_review_id");--> statement-breakpoint
CREATE INDEX "rc_reviews_team_id_idx" ON "rc_reviews" USING btree ("team_id");