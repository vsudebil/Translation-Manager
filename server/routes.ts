import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTranslationFileSchema } from "@shared/schema";
import multer from "multer";
import JSZip from "jszip";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project data with translations
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const projectData = await storage.getProjectData(id);
      
      if (!projectData) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(projectData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project data" });
    }
  });

  // Upload and parse ZIP file
  app.post("/api/projects/upload", upload.single("zipFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const zip = new JSZip();
      const zipData = await zip.loadAsync(req.file.buffer);
      
      // Extract locales and files
      const locales = new Set<string>();
      const filesByLocale = new Map<string, Map<string, any>>();
      
      for (const [path, file] of Object.entries(zipData.files)) {
        if (file.dir) continue;
        
        const pathParts = path.split('/').filter(p => p);
        if (pathParts.length < 2) continue;
        
        const locale = pathParts[0];
        const filename = pathParts[pathParts.length - 1];
        
        if (!filename.endsWith('.json')) continue;
        
        try {
          const content = await file.async("text");
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
        return res.status(400).json({ message: "No valid locale folders with JSON files found" });
      }
      
      // Create project
      const projectName = req.body.projectName || `Translation Project ${Date.now()}`;
      const project = await storage.createProject({
        name: projectName,
        locales: Array.from(locales),
      });
      
      // Create translation files
      for (const [locale, files] of filesByLocale) {
        for (const [filename, content] of files) {
          await storage.createTranslationFile({
            projectId: project.id,
            filename,
            locale,
            content,
          });
        }
      }
      
      const projectData = await storage.getProjectData(project.id);
      res.json(projectData);
      
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process ZIP file" });
    }
  });

  // Update translation
  app.patch("/api/projects/:projectId/translations", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { fileId, content } = req.body;
      
      const updatedFile = await storage.updateTranslationFile(fileId, content);
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update translation" });
    }
  });

  // Add new locale
  app.post("/api/projects/:projectId/locales", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { localeCode, displayName } = req.body;
      
      if (!localeCode || !displayName) {
        return res.status(400).json({ message: "Locale code and display name are required" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get all English files to use as template
      const files = await storage.getTranslationFiles(projectId);
      const englishFiles = files.filter(file => file.locale === 'en');
      
      if (englishFiles.length === 0) {
        return res.status(400).json({ message: "No English locale found to use as template" });
      }
      
      // Create empty versions of all English files for the new locale
      for (const englishFile of englishFiles) {
        const emptyContent = this.createEmptyContent(englishFile.content);
        await storage.createTranslationFile({
          projectId,
          filename: englishFile.filename,
          locale: localeCode,
          content: emptyContent,
        });
      }
      
      // Update project with new locale
      await storage.updateProject(projectId, {
        ...project,
        locales: [...project.locales, localeCode],
      });
      
      const projectData = await storage.getProjectData(projectId);
      res.json(projectData);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to add locale" });
    }
  });

  // Export project as ZIP
  app.get("/api/projects/:projectId/export", async (req, res) => {
    try {
      const { projectId } = req.params;
      const files = await storage.getTranslationFiles(projectId);
      
      if (files.length === 0) {
        return res.status(404).json({ message: "No translation files found" });
      }
      
      const zip = new JSZip();
      
      // Group files by locale and add to ZIP
      for (const file of files) {
        const path = `${file.locale}/${file.filename}`;
        zip.file(path, JSON.stringify(file.content, null, 2));
      }
      
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="translations.zip"`);
      res.send(zipBuffer);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to export translations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to create empty content structure
function createEmptyContent(content: any): any {
  if (typeof content === 'string') {
    return '';
  } else if (typeof content === 'object' && content !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(content)) {
      result[key] = createEmptyContent(value);
    }
    return result;
  }
  return content;
}
