import { type TranslationProject, type InsertProject, type TranslationFile, type InsertTranslationFile, type TranslationKey, type LocaleStats, type ProjectData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<TranslationProject | undefined>;
  createProject(project: InsertProject): Promise<TranslationProject>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<TranslationProject>;
  
  // Translation Files
  getTranslationFiles(projectId: string): Promise<TranslationFile[]>;
  createTranslationFile(file: InsertTranslationFile): Promise<TranslationFile>;
  updateTranslationFile(id: string, content: any): Promise<TranslationFile>;
  deleteTranslationFiles(projectId: string, locale?: string): Promise<void>;
  
  // Combined operations
  getProjectData(id: string): Promise<ProjectData | undefined>;
  getAllProjects(): Promise<TranslationProject[]>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, TranslationProject>;
  private translationFiles: Map<string, TranslationFile>;

  constructor() {
    this.projects = new Map();
    this.translationFiles = new Map();
  }

  async getProject(id: string): Promise<TranslationProject | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<TranslationProject> {
    const id = randomUUID();
    const project: TranslationProject = {
      ...insertProject,
      id,
      createdAt: new Date().toISOString(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<TranslationProject> {
    const existing = this.projects.get(id);
    if (!existing) {
      throw new Error("Project not found");
    }
    const updated = { ...existing, ...updateData };
    this.projects.set(id, updated);
    return updated;
  }

  async getTranslationFiles(projectId: string): Promise<TranslationFile[]> {
    return Array.from(this.translationFiles.values()).filter(
      file => file.projectId === projectId
    );
  }

  async createTranslationFile(insertFile: InsertTranslationFile): Promise<TranslationFile> {
    const id = randomUUID();
    const file: TranslationFile = {
      ...insertFile,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.translationFiles.set(id, file);
    return file;
  }

  async updateTranslationFile(id: string, content: any): Promise<TranslationFile> {
    const existing = this.translationFiles.get(id);
    if (!existing) {
      throw new Error("Translation file not found");
    }
    const updated = {
      ...existing,
      content,
      updatedAt: new Date().toISOString(),
    };
    this.translationFiles.set(id, updated);
    return updated;
  }

  async deleteTranslationFiles(projectId: string, locale?: string): Promise<void> {
    const filesToDelete = Array.from(this.translationFiles.entries()).filter(
      ([_, file]) => file.projectId === projectId && (!locale || file.locale === locale)
    );
    
    for (const [id] of filesToDelete) {
      this.translationFiles.delete(id);
    }
  }

  async getProjectData(id: string): Promise<ProjectData | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;

    const files = await this.getTranslationFiles(id);
    
    // Build translation keys from files
    const keyMap = new Map<string, TranslationKey>();
    
    for (const file of files) {
      this.extractKeys(file.content, file.filename, file.locale, "", keyMap);
    }
    
    const keys = Array.from(keyMap.values());
    
    // Calculate stats
    const stats: LocaleStats[] = project.locales.map(locale => {
      const localeKeys = keys.filter(key => key.translations[locale] !== undefined);
      const translatedKeys = localeKeys.filter(key => key.translations[locale]?.trim() !== "").length;
      
      return {
        locale,
        totalKeys: keys.length,
        translatedKeys,
        completeness: keys.length > 0 ? Math.round((translatedKeys / keys.length) * 100) : 0,
      };
    });

    return { project, files, keys, stats };
  }

  async getAllProjects(): Promise<TranslationProject[]> {
    return Array.from(this.projects.values());
  }

  private extractKeys(obj: any, filename: string, locale: string, prefix: string, keyMap: Map<string, TranslationKey>): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string') {
        if (!keyMap.has(fullKey)) {
          keyMap.set(fullKey, {
            key: fullKey,
            file: filename,
            translations: {},
          });
        }
        const existingKey = keyMap.get(fullKey)!;
        existingKey.translations[locale] = value;
      } else if (typeof value === 'object' && value !== null) {
        this.extractKeys(value, filename, locale, fullKey, keyMap);
      }
    }
  }
}

export const storage = new MemStorage();
