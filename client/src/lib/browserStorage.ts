import { type TranslationProject, type TranslationFile, type TranslationKey, type LocaleStats, type ProjectData } from "@shared/schema";
import JSZip from "jszip";

// Browser-compatible UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface IBrowserStorage {
  // Projects
  getProject(id: string): Promise<TranslationProject | undefined>;
  createProject(name: string, locales: string[]): Promise<TranslationProject>;
  updateProject(id: string, updates: Partial<TranslationProject>): Promise<TranslationProject>;
  
  // Translation Files
  getTranslationFiles(projectId: string): Promise<TranslationFile[]>;
  createTranslationFile(file: Omit<TranslationFile, 'id' | 'updatedAt'>): Promise<TranslationFile>;
  updateTranslationFile(id: string, content: any): Promise<TranslationFile>;
  deleteTranslationFiles(projectId: string, locale?: string): Promise<void>;
  
  // Combined operations
  getProjectData(id: string): Promise<ProjectData | undefined>;
  getAllProjects(): Promise<TranslationProject[]>;
  
  // Browser-specific operations
  processZipFile(file: File, projectName: string): Promise<ProjectData>;
  exportProject(projectId: string): Promise<Blob>;
  addLocale(projectId: string, localeCode: string): Promise<ProjectData>;
}

export class BrowserStorage implements IBrowserStorage {
  private readonly PROJECTS_KEY = 'translation_projects';
  private readonly FILES_KEY = 'translation_files';

  private getProjects(): Map<string, TranslationProject> {
    const data = localStorage.getItem(this.PROJECTS_KEY);
    if (!data) return new Map();
    
    try {
      const projectArray = JSON.parse(data) as TranslationProject[];
      return new Map(projectArray.map(p => [p.id, p]));
    } catch {
      return new Map();
    }
  }

  private saveProjects(projects: Map<string, TranslationProject>): void {
    const projectArray = Array.from(projects.values());
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projectArray));
  }

  private getFiles(): Map<string, TranslationFile> {
    const data = localStorage.getItem(this.FILES_KEY);
    if (!data) return new Map();
    
    try {
      const fileArray = JSON.parse(data) as TranslationFile[];
      return new Map(fileArray.map(f => [f.id, f]));
    } catch {
      return new Map();
    }
  }

  private saveFiles(files: Map<string, TranslationFile>): void {
    const fileArray = Array.from(files.values());
    localStorage.setItem(this.FILES_KEY, JSON.stringify(fileArray));
  }

  async getProject(id: string): Promise<TranslationProject | undefined> {
    const projects = this.getProjects();
    return projects.get(id);
  }

  async createProject(name: string, locales: string[]): Promise<TranslationProject> {
    const projects = this.getProjects();
    const id = generateUUID();
    
    const project: TranslationProject = {
      id,
      name,
      locales,
      createdAt: new Date().toISOString(),
    };
    
    projects.set(id, project);
    this.saveProjects(projects);
    return project;
  }

  async updateProject(id: string, updates: Partial<TranslationProject>): Promise<TranslationProject> {
    const projects = this.getProjects();
    const existing = projects.get(id);
    
    if (!existing) {
      throw new Error("Project not found");
    }
    
    const updated = { ...existing, ...updates };
    projects.set(id, updated);
    this.saveProjects(projects);
    return updated;
  }

  async getTranslationFiles(projectId: string): Promise<TranslationFile[]> {
    const files = this.getFiles();
    return Array.from(files.values()).filter(file => file.projectId === projectId);
  }

  async createTranslationFile(fileData: Omit<TranslationFile, 'id' | 'updatedAt'>): Promise<TranslationFile> {
    const files = this.getFiles();
    const id = generateUUID();
    
    const file: TranslationFile = {
      ...fileData,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    files.set(id, file);
    this.saveFiles(files);
    return file;
  }

  async updateTranslationFile(id: string, content: any): Promise<TranslationFile> {
    const files = this.getFiles();
    const existing = files.get(id);
    
    if (!existing) {
      throw new Error("Translation file not found");
    }
    
    const updated = {
      ...existing,
      content,
      updatedAt: new Date().toISOString(),
    };
    
    files.set(id, updated);
    this.saveFiles(files);
    return updated;
  }

  async deleteTranslationFiles(projectId: string, locale?: string): Promise<void> {
    const files = this.getFiles();
    const filesToDelete = Array.from(files.entries()).filter(
      ([_, file]) => file.projectId === projectId && (!locale || file.locale === locale)
    );
    
    for (const [id] of filesToDelete) {
      files.delete(id);
    }
    
    this.saveFiles(files);
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
    const projects = this.getProjects();
    return Array.from(projects.values());
  }

  async processZipFile(file: File, projectName: string): Promise<ProjectData> {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(file);
    
    // Extract locales and files
    const locales = new Set<string>();
    const filesByLocale = new Map<string, Map<string, any>>();
    
    for (const [path, zipFile] of Object.entries(zipData.files)) {
      if (zipFile.dir) continue;
      
      const pathParts = path.split('/').filter(p => p);
      if (pathParts.length < 2) continue;
      
      const locale = pathParts[0];
      const filename = pathParts[pathParts.length - 1];
      
      if (!filename.endsWith('.json')) continue;
      
      try {
        const content = await zipFile.async("text");
        const jsonContent = JSON.parse(content);
        
        locales.add(locale);
        
        if (!filesByLocale.has(locale)) {
          filesByLocale.set(locale, new Map());
        }
        
        filesByLocale.get(locale)!.set(filename, jsonContent);
      } catch (error) {
        console.warn(`Failed to parse JSON file: ${path}`);
        continue;
      }
    }
    
    if (locales.size === 0) {
      throw new Error("No valid locale folders with JSON files found");
    }
    
    // Create project
    const project = await this.createProject(projectName, Array.from(locales));
    
    // Create translation files
    for (const [locale, files] of Array.from(filesByLocale.entries())) {
      for (const [filename, content] of Array.from(files.entries())) {
        await this.createTranslationFile({
          projectId: project.id,
          filename,
          locale,
          content,
        });
      }
    }
    
    const projectData = await this.getProjectData(project.id);
    if (!projectData) {
      throw new Error("Failed to create project data");
    }
    
    return projectData;
  }

  async exportProject(projectId: string): Promise<Blob> {
    const files = await this.getTranslationFiles(projectId);
    
    if (files.length === 0) {
      throw new Error("No translation files found");
    }
    
    const zip = new JSZip();
    
    // Group files by locale and add to ZIP
    for (const file of files) {
      const path = `${file.locale}/${file.filename}`;
      zip.file(path, JSON.stringify(file.content, null, 2));
    }
    
    return await zip.generateAsync({ type: "blob" });
  }

  async addLocale(projectId: string, localeCode: string): Promise<ProjectData> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Get all English files to use as template
    const files = await this.getTranslationFiles(projectId);
    const englishFiles = files.filter(file => file.locale === 'en');
    
    if (englishFiles.length === 0) {
      throw new Error("No English locale found to use as template");
    }
    
    // Create empty versions of all English files for the new locale
    for (const englishFile of englishFiles) {
      const emptyContent = this.createEmptyContent(englishFile.content);
      await this.createTranslationFile({
        projectId,
        filename: englishFile.filename,
        locale: localeCode,
        content: emptyContent,
      });
    }
    
    // Update project with new locale
    await this.updateProject(projectId, {
      locales: [...project.locales, localeCode],
    });
    
    const projectData = await this.getProjectData(projectId);
    if (!projectData) {
      throw new Error("Failed to get updated project data");
    }
    
    return projectData;
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

  private createEmptyContent(content: any): any {
    if (typeof content === 'string') {
      return '';
    } else if (typeof content === 'object' && content !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(content)) {
        result[key] = this.createEmptyContent(value);
      }
      return result;
    }
    return content;
  }
}

export const browserStorage = new BrowserStorage();