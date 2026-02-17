import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProjectData } from "@shared/schema";

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFile: string;
  onFileChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  fileGroups: string[];
  projectData: ProjectData;
  selectedLocales: string[];
  onLocalesChange: (locales: string[]) => void;
}

export default function FilterControls({
  searchQuery,
  onSearchChange,
  selectedFile,
  onFileChange,
  statusFilter,
  onStatusChange,
  fileGroups,
  projectData,
  selectedLocales,
  onLocalesChange,
}: FilterControlsProps) {
  
  const getFileKeyCount = (filename: string) => {
    return projectData.keys.filter(key => key.file === filename).length;
  };

  const toggleLocale = (locale: string) => {
    if (selectedLocales.includes(locale)) {
      if (selectedLocales.length > 1) {
        onLocalesChange(selectedLocales.filter(l => l !== locale));
      }
    } else {
      onLocalesChange([...selectedLocales, locale]);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="search-input" className="block text-sm font-medium text-foreground mb-2">
            Search Keys
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              type="text"
              placeholder="Search translation keys..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-foreground mb-2">
            Filter by File
          </Label>
          <Select value={selectedFile} onValueChange={onFileChange}>
            <SelectTrigger data-testid="select-file-filter">
              <SelectValue placeholder="All Files" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all-files">All Files</SelectItem>
              {fileGroups.map(filename => (
                <SelectItem key={filename} value={filename} data-testid={`option-file-${filename}`}>
                  {filename} ({getFileKeyCount(filename)} keys)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-foreground mb-2">
            Translation Status
          </Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all-status">All Status</SelectItem>
              <SelectItem value="complete" data-testid="option-complete">Complete</SelectItem>
              <SelectItem value="missing" data-testid="option-missing">Missing Translations</SelectItem>
              <SelectItem value="empty" data-testid="option-empty">Empty Values</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <Label className="block text-sm font-medium text-foreground mb-3">
          Display Languages
        </Label>
        <div className="flex flex-wrap gap-2">
          {projectData.project.locales.map(locale => (
            <Badge
              key={locale}
              variant={selectedLocales.includes(locale) ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-sm transition-all"
              onClick={() => toggleLocale(locale)}
              data-testid={`badge-toggle-locale-${locale}`}
            >
              {locale.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
