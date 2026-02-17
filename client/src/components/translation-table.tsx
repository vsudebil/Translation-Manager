import { useState, useMemo, useRef } from "react";
import { Copy, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ProjectData, TranslationKey } from "@shared/schema";
import { browserStorage } from "@/lib/browserStorage";
import { useVirtualizer } from "@tanstack/react-virtual";

interface TranslationTableProps {
  projectData: ProjectData;
  filteredKeys: TranslationKey[];
  onRefresh: () => void;
  visibleLocales: string[];
}

export default function TranslationTable({ projectData, filteredKeys, onRefresh, visibleLocales }: TranslationTableProps) {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTranslationChange = (keyPath: string, locale: string, value: string) => {
    const editKey = `${keyPath}-${locale}`;
    setEditingValues(prev => ({ ...prev, [editKey]: value }));
  };

  const handleTranslationSave = async (keyPath: string, locale: string, valueOverride?: string) => {
    const editKey = `${keyPath}-${locale}`;
    const newValue = valueOverride !== undefined ? valueOverride : editingValues[editKey];
    
    if (newValue === undefined) return;

    try {
      // Find the file that contains this key
      const key = filteredKeys.find(k => k.key === keyPath);
      if (!key) return;

      const file = projectData.files.find(f => f.filename === key.file && f.locale === locale);
      if (!file) return;

      // Update the nested object structure  
      const updatedContent = JSON.parse(JSON.stringify(file.content));
      const keyParts = keyPath.split('.');
      let current = updatedContent;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      current[keyParts[keyParts.length - 1]] = newValue;

      await browserStorage.updateTranslationFile(file.id, updatedContent);

      // Remove from editing values only if we are blurring or if it matches current
      if (valueOverride === undefined) {
        setEditingValues(prev => {
          const newValues = { ...prev };
          delete newValues[editKey];
          return newValues;
        });
      }

      // Avoid full refresh if only small change, but we need it for completeness stats
      // debouncing this might be better for performance, but user wants immediate "save"
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

  // Create flattened list for virtualization (file headers + keys)
  const virtualItems = useMemo(() => {
    const items: Array<{ type: 'fileHeader'; filename: string; keys: TranslationKey[] } | { type: 'translationKey'; key: TranslationKey }> = [];
    
    // Group keys by file
    const keysByFile = filteredKeys.reduce((acc, key) => {
      if (!acc[key.file]) {
        acc[key.file] = [];
      }
      acc[key.file].push(key);
      return acc;
    }, {} as Record<string, TranslationKey[]>);

    // Flatten into virtual items
    Object.entries(keysByFile).forEach(([filename, keys]) => {
      // Add file header
      items.push({ type: 'fileHeader', filename, keys });
      // Add all keys for this file
      keys.forEach(key => {
        items.push({ type: 'translationKey', key });
      });
    });

    return items;
  }, [filteredKeys]);

  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      if (item?.type === 'fileHeader') return 56;
      
      // Dynamic height estimation based on content length
      const maxContentLength = Math.max(
        ...visibleLocales.map(l => (item.key.translations[l] || '').length),
        item.key.key.length / 2
      );
      return Math.max(100, Math.min(300, 60 + Math.ceil(maxContentLength / 40) * 20));
    },
    overscan: 10,
  });

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
      <div className="relative">
        {/* Scrollable Content Area with Fixed Header */}
        <div
          ref={parentRef}
          className="h-[700px] overflow-auto"
        >
          {/* Fixed Table Header */}
          <div className="sticky top-0 z-10 bg-background">
            <div className="flex border-b" style={{ minWidth: '100%' }}>
              <div className="py-3 px-4 font-medium text-foreground border-r border-border sticky left-0 bg-background min-w-[25%] z-20">
                Translation Key
              </div>
              {visibleLocales.map(locale => {
                const completeness = getLocaleCompleteness(locale);
                return (
                  <div
                    key={locale}
                    className="py-3 px-4 z-10 font-medium text-foreground flex-1 min-w-[300px]"
                    data-testid={`header-locale-${locale}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{locale.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getCompletenessColor(completeness)}`}>
                        {completeness}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Virtualized Content */}
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              minWidth: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = virtualItems[virtualItem.index];
              
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item?.type === 'fileHeader' ? (
                    // File Group Header
                    <div 
                      className="file-group-header bg-gradient-to-r from-primary/10 to-accent border-b border-border h-full flex items-center"
                      style={{ minWidth: '100%' }}
                    >
                      <div className="py-3 px-4 font-semibold text-foreground w-full" data-testid={`file-group-${item.filename}`}>
                        <div className="flex items-center space-x-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span>{item.filename}</span>
                          <span className="text-sm text-muted-foreground">({item.keys.length} keys)</span>
                        </div>
                      </div>
                    </div>
                  ) : item?.type === 'translationKey' ? (
                    // Translation Key Row
                    <div 
                      className="border-b border-border hover:bg-accent/50 transition-colors group h-full flex items-stretch" 
                      data-testid={`row-key-${item.key.key}`}
                      style={{ minWidth: '100%' }}
                    >
                      <div className="py-3 px-4 font-mono text-xs text-foreground sticky left-0 bg-card border-r border-border min-w-[25%] flex items-start z-10 overflow-hidden break-all">
                        <div className="flex items-start space-x-2 w-full">
                          <span data-testid={`text-key-${item.key.key}`}>{item.key.key}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-auto flex-shrink-0"
                            onClick={() => handleCopyKey(item.key.key)}
                            data-testid={`button-copy-${item.key.key}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {visibleLocales.map(locale => {
                        const editKey = `${item.key.key}-${locale}`;
                        const currentValue = editingValues[editKey] !== undefined 
                          ? editingValues[editKey] 
                          : item.key.translations[locale] || '';
                        const isEmpty = !item.key.translations[locale] || item.key.translations[locale].trim() === '';
                        
                        return (
                          <div key={locale} className="py-2 px-4 flex-1 min-w-[300px] flex items-stretch border-r border-border last:border-r-0">
                            <Textarea
                              value={currentValue}
                              onChange={(e) => {
                                handleTranslationChange(item.key.key, locale, e.target.value);
                                // Debounced or immediate save? User said "save upon every change"
                                // Let's implement immediate save for responsiveness as per request
                                handleTranslationSave(item.key.key, locale, e.target.value);
                              }}
                              onFocus={() => setFocusedInput(editKey)}
                              onBlur={() => handleTranslationSave(item.key.key, locale)}
                              placeholder={isEmpty ? "Missing translation" : undefined}
                              className={`translation-input w-full text-sm min-h-full transition-all border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none p-1 ${
                                isEmpty 
                                  ? 'bg-destructive/5 placeholder:text-destructive/60' 
                                  : 'bg-transparent hover:bg-accent focus:bg-background'
                              }`}
                              data-testid={`textarea-translation-${item.key.key}-${locale}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
