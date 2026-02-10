CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"original_s3_key" text NOT NULL,
	"processed_s3_key" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"aspect_ratio" text NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "render_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_draft_id" uuid NOT NULL,
	"workflow_run_id" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"stage" text NOT NULL,
	"logs_json" jsonb DEFAULT '[]'::jsonb,
	"error_json" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"supported_ratios" jsonb NOT NULL,
	"min_screens" integer NOT NULL,
	"max_screens" integer NOT NULL,
	"schema_version" text DEFAULT '1.0.0' NOT NULL,
	"default_config_json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_id" varchar(50) NOT NULL,
	"ratio" varchar(10) NOT NULL,
	"fps" integer DEFAULT 30 NOT NULL,
	"duration_in_frames" integer NOT NULL,
	"props_json" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"output_s3_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_video_draft_id_video_drafts_id_fk" FOREIGN KEY ("video_draft_id") REFERENCES "public"."video_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_drafts" ADD CONSTRAINT "video_drafts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_drafts" ADD CONSTRAINT "video_drafts_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;