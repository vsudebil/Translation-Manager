import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const translationProjects = pgTable("translation_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  locales: text("locales").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: text("created_at").default(sql`now()`),
});

export const translationFiles = pgTable("translation_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => translationProjects.id).notNull(),
  filename: text("filename").notNull(),
  locale: text("locale").notNull(),
  content: jsonb("content").notNull(),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertProjectSchema = createInsertSchema(translationProjects).omit({
  id: true,
  createdAt: true,
});

export const insertTranslationFileSchema = createInsertSchema(translationFiles).omit({
  id: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TranslationProject = typeof translationProjects.$inferSelect;
export type InsertTranslationFile = z.infer<typeof insertTranslationFileSchema>;
export type TranslationFile = typeof translationFiles.$inferSelect;

// Additional types for the application
export interface TranslationKey {
  key: string;
  file: string;
  translations: Record<string, string>;
}

export interface LocaleStats {
  locale: string;
  completeness: number;
  totalKeys: number;
  translatedKeys: number;
}

export interface ProjectData {
  project: TranslationProject;
  files: TranslationFile[];
  keys: TranslationKey[];
  stats: LocaleStats[];
}
