import { useState } from "react";
import { Copy, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ProjectData, TranslationKey } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface TranslationTableProps {
  projectData: ProjectData;
  filteredKeys: TranslationKey[];
  onRefresh: () => void;
}

export default function TranslationTable({ projectData, filteredKeys, onRefresh }: TranslationTableProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleTranslationChange = (keyPath: string, locale: string, value: string) => {
    const editKey = `${keyPath}-${locale}`;
    setEditingValues(prev => ({ ...prev, [editKey]: value }));
  };

  const handleTranslationSave = async (keyPath: string, locale: string) => {
    const editKey = `${keyPath}-${locale}`;
    const newValue = editingValues[editKey];
    
    if (newValue === undefined) return;

    try {
      // Find the file that contains this key
      const key = filteredKeys.find(k => k.key === keyPath);
      if (!key) return;

      const file = projectData.files.find(f => f.filename === key.file && f.locale === locale);
      if (!file) return;

      // Update the nested object structure
      const updatedContent = { ...file.content };
      const keyParts = keyPath.split('.');
      let current = updatedContent;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      current[keyParts[keyParts.length - 1]] = newValue;

      await apiRequest('PATCH', `/api/projects/${projectData.project.id}/translations`, {
        fileId: file.id,
        content: updatedContent,
      });

      // Remove from editing values
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[editKey];
        return newValues;
      });

      onRefresh();
      
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save translation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyKey = (keyPath: string) => {
    navigator.clipboard.writeText(keyPath);
    toast({
      title: "Key copied",
      description: `Translation key "${keyPath}" copied to clipboard.`,
    });
  };

  // Group keys by file
  const keysByFile = filteredKeys.reduce((acc, key) => {
    if (!acc[key.file]) {
      acc[key.file] = [];
    }
    acc[key.file].push(key);
    return acc;
  }, {} as Record<string, TranslationKey[]>);

  const getLocaleCompleteness = (locale: string) => {
    const stat = projectData.stats.find(s => s.locale === locale);
    return stat?.completeness || 0;
  };

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (completeness >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-6">
      {/* Table Header */}
      <div className="bg-muted px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Translation Keys</h2>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span data-testid="text-filtered-results">
              Showing {filteredKeys.length} of {projectData.keys.length} keys
            </span>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-foreground border-b border-border sticky left-0 bg-muted/50 min-w-64">
                Translation Key
              </th>
              {projectData.project.locales.map(locale => {
                const completeness = getLocaleCompleteness(locale);
                return (
                  <th
                    key={locale}
                    className="text-left py-3 px-4 font-medium text-foreground border-b border-border min-w-80"
                    data-testid={`header-locale-${locale}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{locale.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getCompletenessColor(completeness)}`}>
                        {completeness}%
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Object.entries(keysByFile).map(([filename, keys]) => (
              <div key={filename}>
                {/* File Group Header */}
                <tr className="file-group-header bg-gradient-to-r from-primary/10 to-accent">
                  <td
                    colSpan={projectData.project.locales.length + 1}
                    className="py-3 px-4 font-semibold text-foreground"
                    data-testid={`file-group-${filename}`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileCode className="h-4 w-4 text-primary" />
                      <span>{filename}</span>
                      <span className="text-sm text-muted-foreground">({keys.length} keys)</span>
                    </div>
                  </td>
                </tr>
                
                {/* Translation Keys */}
                {keys.map(key => (
                  <tr
                    key={key.key}
                    className="border-b border-border hover:bg-accent/50 transition-colors group"
                    data-testid={`row-key-${key.key}`}
                  >
                    <td className="py-3 px-4 font-mono text-sm text-foreground sticky left-0 bg-card border-r border-border">
                      <div className="flex items-center space-x-2">
                        <span data-testid={`text-key-${key.key}`}>{key.key}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={() => handleCopyKey(key.key)}
                          data-testid={`button-copy-${key.key}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    {projectData.project.locales.map(locale => {
                      const editKey = `${key.key}-${locale}`;
                      const currentValue = editingValues[editKey] !== undefined 
                        ? editingValues[editKey] 
                        : key.translations[locale] || '';
                      const isEmpty = !key.translations[locale] || key.translations[locale].trim() === '';
                      
                      return (
                        <td key={locale} className="py-2 px-4">
                          <Input
                            value={currentValue}
                            onChange={(e) => handleTranslationChange(key.key, locale, e.target.value)}
                            onBlur={() => handleTranslationSave(key.key, locale)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            placeholder={isEmpty ? "Missing translation" : undefined}
                            className={`translation-input w-full text-sm ${
                              isEmpty 
                                ? 'bg-destructive/5 border-destructive/20 placeholder:text-destructive/60' 
                                : 'bg-transparent border-transparent hover:border-border hover:bg-accent focus:border-primary focus:bg-background'
                            }`}
                            data-testid={`input-translation-${key.key}-${locale}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </div>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
