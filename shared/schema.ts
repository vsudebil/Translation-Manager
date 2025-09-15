// TypeScript interfaces for the translation application

export interface TranslationProject {
  id: string;
  name: string;
  locales: string[];
  createdAt?: string;
}

export interface TranslationFile {
  id: string;
  projectId: string;
  filename: string;
  locale: string;
  content: Record<string, string>;
  updatedAt?: string;
}

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
