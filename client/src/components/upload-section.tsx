import { useState, useRef } from "react";
import { FileArchive, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProjectData } from "@shared/schema";

interface UploadSectionProps {
  onUploadComplete: (data: ProjectData) => void;
}

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a ZIP file containing locale folders.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('zipFile', file);
      formData.append('projectName', `Uploaded Project ${new Date().toLocaleDateString()}`);
      
      const response = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      const data = await response.json();
      onUploadComplete(data);
      
      toast({
        title: "Upload successful",
        description: `Project created with ${data.project.locales.length} locales and ${data.keys.length} translation keys.`,
      });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="mb-8">
      <div
        className={`upload-zone border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragOver ? 'border-primary bg-primary/5 scale-102' : 'border-border hover:border-primary hover:bg-primary/2'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="upload-zone"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".zip"
          className="hidden"
          data-testid="input-file"
        />
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <FileArchive className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Upload Translation Files
            </h3>
            <p className="text-muted-foreground mb-4">
              Drop your ZIP file containing locale folders (en, de, fr, etc.) with JSON translation files
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="button-choose-file"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Processing...' : 'Choose ZIP File'}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Supported structure: /en/about.json, /de/about.json, /fr/admin.json, etc.
          </div>
        </div>
      </div>
    </div>
  );
}
