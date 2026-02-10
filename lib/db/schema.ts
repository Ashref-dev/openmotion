import { pgTable, uuid, text, timestamp, jsonb, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Projects Table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Assets Table
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // screenshot | logo | background
  originalS3Key: text('original_s3_key').notNull(),
  processedS3Key: text('processed_s3_key'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  aspectRatio: text('aspect_ratio').notNull(),
  hash: text('hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Templates Table
export const templates = pgTable('templates', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  supportedRatios: jsonb('supported_ratios').$type<string[]>().notNull(),
  minScreens: integer('min_screens').notNull(),
  maxScreens: integer('max_screens').notNull(),
  schemaVersion: text('schema_version').notNull().default('1.0.0'),
  defaultConfigJson: jsonb('default_config_json').$type<Record<string, any>>().notNull(),
});

// VideoDrafts Table  
export const videoDrafts = pgTable('video_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  templateId: varchar('template_id', { length: 50 }).references(() => templates.id).notNull(),
  ratio: varchar('ratio', { length: 10 }).notNull(), // 9:16 | 16:9 | 1:1
  fps: integer('fps').notNull().default(30),
  durationInFrames: integer('duration_in_frames').notNull(),
  propsJson: jsonb('props_json').$type<Record<string, any>>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | rendering | completed | failed | canceled
  outputS3Key: text('output_s3_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RenderJobs Table
export const renderJobs = pgTable('render_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoDraftId: uuid('video_draft_id').references(() => videoDrafts.id, { onDelete: 'cascade' }).notNull(),
  workflowRunId: text('workflow_run_id').notNull(),
  progress: integer('progress').notNull().default(0), // 0-100
  stage: text('stage').notNull(), // bundling | rendering | encoding | uploading | completed | failed | canceled
  logsJson: jsonb('logs_json').$type<string[]>().default([]),
  errorJson: jsonb('error_json').$type<Record<string, any>>(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  assets: many(assets),
  videoDrafts: many(videoDrafts),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
}));

export const videoDraftsRelations = relations(videoDrafts, ({ one, many }) => ({
  project: one(projects, {
    fields: [videoDrafts.projectId],
    references: [projects.id],
  }),
  template: one(templates, {
    fields: [videoDrafts.templateId],
    references: [templates.id],
  }),
  renderJobs: many(renderJobs),
}));

export const renderJobsRelations = relations(renderJobs, ({ one }) => ({
  videoDraft: one(videoDrafts, {
    fields: [renderJobs.videoDraftId],
    references: [videoDrafts.id],
  }),
}));
