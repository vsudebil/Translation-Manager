import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Languages, Download, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadSection from "@/components/upload-section";
import TranslationTable from "@/components/translation-table";
import FilterControls from "@/components/filter-controls";
import AddLocaleModal from "@/components/add-locale-modal";
import ProjectList from "@/components/project-list";
import { ProjectData } from "@shared/schema";
import { browserStorage } from "@/lib/browserStorage";

export default function TranslationManager() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = params.id;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddLocaleModal, setShowAddLocaleModal] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadProjectData = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await browserStorage.getProjectData(projectId);
      setProjectData(data || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load project'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const handleExport = async () => {
    if (!projectId) return;
    
    try {
      const blob = await browserStorage.exportProject(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'translations.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Languages className="h-8 w-8 text-primary" />
                  <h1 className="text-xl font-bold text-foreground">Translation Manager</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <UploadSection onUploadComplete={(data) => {
            setLocation(`/project/${data.project.id}`);
          }} />
          
          <ProjectList />
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load project data</p>
          <Button onClick={() => loadProjectData()} data-testid="button-retry">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredKeys = projectData.keys.filter(key => {
    const matchesSearch = key.key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFile = selectedFile === "all" || !selectedFile || key.file === selectedFile;
    
    let matchesStatus = true;
    if (statusFilter === "missing") {
      matchesStatus = projectData.project.locales.some(locale => 
        !key.translations[locale] || key.translations[locale].trim() === ""
      );
    } else if (statusFilter === "complete") {
      matchesStatus = projectData.project.locales.every(locale => 
        key.translations[locale] && key.translations[locale].trim() !== ""
      );
    } else if (statusFilter === "empty") {
      matchesStatus = projectData.project.locales.some(locale => 
        key.translations[locale] === ""
      );
    } else if (statusFilter === "all") {
      matchesStatus = true;
    }
    
    return matchesSearch && matchesFile && matchesStatus;
  });

  const overallProgress = projectData.stats.length > 0 
    ? Math.round(projectData.stats.reduce((sum, stat) => sum + stat.completeness, 0) / projectData.stats.length)
    : 0;

  const totalKeys = projectData.keys.length;
  const fileGroups = Array.from(new Set(projectData.keys.map(key => key.file)));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setLocation('/')} data-testid="button-home">
                <Languages className="h-8 w-8 text-primary hover:text-primary/80 transition-colors" />
                <div>
                  <h1 className="text-xl font-bold text-foreground hover:text-primary transition-colors">Translation Manager</h1>
                  <p className="text-sm text-muted-foreground" data-testid="text-project-id">Project: {projectId}</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <span data-testid="text-project-name">{projectData.project.name}</span>
                <span>•</span>
                <span data-testid="text-total-keys">{totalKeys} keys</span>
                <span>•</span>
                <span data-testid="text-locales-count">{projectData.project.locales.length} locales</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/')}
                data-testid="button-back-home"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddLocaleModal(true)}
                data-testid="button-add-locale"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Locale
              </Button>
              <Button
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export ZIP
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <FilterControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          fileGroups={fileGroups}
          projectData={projectData}
        />

        <TranslationTable
          projectData={projectData}
          filteredKeys={filteredKeys}
          onRefresh={loadProjectData}
        />

        <div className="mt-6 bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Auto-saved</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Translation Progress: 
                <span className="font-medium text-foreground ml-1" data-testid="text-progress">
                  {overallProgress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AddLocaleModal
        isOpen={showAddLocaleModal}
        onClose={() => setShowAddLocaleModal(false)}
        projectId={projectId}
        onSuccess={loadProjectData}
      />
    </div>
  );
}
