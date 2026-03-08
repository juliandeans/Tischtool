import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    coverImageId: uuid('cover_image_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => sql`now()`)
  },
  (table) => ({
    userIdx: index('projects_user_id_idx').on(table.userId),
    coverImageIdx: index('projects_cover_image_id_idx').on(table.coverImageId)
  })
);

export const images = pgTable(
  'images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentImageId: uuid('parent_image_id').references((): AnyPgColumn => images.id, {
      onDelete: 'set null'
    }),
    generationId: uuid('generation_id'),
    type: text('type').notNull(),
    filePath: text('file_path').notNull(),
    thumbnailPath: text('thumbnail_path'),
    mimeType: text('mime_type').notNull(),
    width: integer('width'),
    height: integer('height'),
    placementX: integer('placement_x'),
    placementY: integer('placement_y'),
    placementWidth: integer('placement_width'),
    placementHeight: integer('placement_height'),
    promptSnapshot: jsonb('prompt_snapshot'),
    settingsSnapshot: jsonb('settings_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    projectIdx: index('images_project_id_idx').on(table.projectId),
    userIdx: index('images_user_id_idx').on(table.userId),
    parentImageIdx: index('images_parent_image_id_idx').on(table.parentImageId),
    generationIdx: index('images_generation_id_idx').on(table.generationId)
  })
);

export const generations = pgTable(
  'generations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sourceImageId: uuid('source_image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    mode: text('mode').notNull(),
    promptText: text('prompt_text').notNull(),
    systemPromptText: text('system_prompt_text'),
    settingsJson: jsonb('settings_json'),
    variantsRequested: integer('variants_requested').notNull().default(1),
    variantsReturned: integer('variants_returned').notNull().default(0),
    usageJson: jsonb('usage_json'),
    estimatedCost: numeric('estimated_cost', { precision: 12, scale: 4 }),
    actualCost: numeric('actual_cost', { precision: 12, scale: 4 }),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    projectIdx: index('generations_project_id_idx').on(table.projectId),
    userIdx: index('generations_user_id_idx').on(table.userId),
    sourceImageIdx: index('generations_source_image_id_idx').on(table.sourceImageId),
    modeIdx: index('generations_mode_idx').on(table.mode),
    statusIdx: index('generations_status_idx').on(table.status)
  })
);

export const presets = pgTable(
  'presets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    name: text('name').notNull(),
    promptFragment: text('prompt_fragment').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index('presets_user_id_idx').on(table.userId),
    categoryIdx: index('presets_category_idx').on(table.category)
  })
);

export const costLogs = pgTable(
  'cost_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    generationId: uuid('generation_id')
      .notNull()
      .references(() => generations.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    unitType: text('unit_type').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 4 }).notNull(),
    totalPrice: numeric('total_price', { precision: 12, scale: 4 }).notNull(),
    currency: text('currency').notNull().default('EUR'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    generationIdx: index('cost_logs_generation_id_idx').on(table.generationId)
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  images: many(images),
  generations: many(generations),
  presets: many(presets)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id]
  }),
  coverImage: one(images, {
    fields: [projects.coverImageId],
    references: [images.id]
  }),
  images: many(images),
  generations: many(generations)
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
  project: one(projects, {
    fields: [images.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [images.userId],
    references: [users.id]
  }),
  parentImage: one(images, {
    fields: [images.parentImageId],
    references: [images.id],
    relationName: 'image_parent'
  }),
  childImages: many(images, {
    relationName: 'image_parent'
  }),
  generation: one(generations, {
    fields: [images.generationId],
    references: [generations.id]
  })
}));

export const generationsRelations = relations(generations, ({ one, many }) => ({
  project: one(projects, {
    fields: [generations.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [generations.userId],
    references: [users.id]
  }),
  sourceImage: one(images, {
    fields: [generations.sourceImageId],
    references: [images.id]
  }),
  costLogs: many(costLogs),
  images: many(images)
}));

export const presetsRelations = relations(presets, ({ one }) => ({
  user: one(users, {
    fields: [presets.userId],
    references: [users.id]
  })
}));

export const costLogsRelations = relations(costLogs, ({ one }) => ({
  generation: one(generations, {
    fields: [costLogs.generationId],
    references: [generations.id]
  })
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
export type Image = InferSelectModel<typeof images>;
export type NewImage = InferInsertModel<typeof images>;
export type Generation = InferSelectModel<typeof generations>;
export type NewGeneration = InferInsertModel<typeof generations>;
export type Preset = InferSelectModel<typeof presets>;
export type NewPreset = InferInsertModel<typeof presets>;
export type CostLog = InferSelectModel<typeof costLogs>;
export type NewCostLog = InferInsertModel<typeof costLogs>;
