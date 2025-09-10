import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Clock, Languages, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TranslationProject } from "@shared/schema";
import { browserStorage } from "@/lib/browserStorage";

export default function ProjectList() {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const allProjects = await browserStorage.getAllProjects();
        setProjects(allProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Recent Projects</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Projects Yet</h3>
        <p className="text-muted-foreground">Upload your first translation ZIP file to get started.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Recent Projects</h2>
        <Badge variant="secondary" data-testid="text-project-count">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-accent/50 group"
            onClick={() => setLocation(`/project/${project.id}`)}
            data-testid={`card-project-${project.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors" data-testid={`text-project-name-${project.id}`}>
                    {project.name}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span data-testid={`text-created-date-${project.id}`}>
                      {formatDate(project.createdAt || '')}
                    </span>
                  </CardDescription>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground font-medium" data-testid={`text-locale-count-${project.id}`}>
                    {project.locales.length} language{project.locales.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {project.locales.slice(0, 4).map((locale) => (
                    <Badge 
                      key={locale} 
                      variant="outline" 
                      className="text-xs"
                      data-testid={`badge-locale-${locale}-${project.id}`}
                    >
                      {locale.toUpperCase()}
                    </Badge>
                  ))}
                  {project.locales.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.locales.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}