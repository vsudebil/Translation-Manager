import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddLocaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export default function AddLocaleModal({ isOpen, onClose, projectId, onSuccess }: AddLocaleModalProps) {
  const [localeCode, setLocaleCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localeCode.trim() || !displayName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both locale code and display name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest('POST', `/api/projects/${projectId}/locales`, {
        localeCode: localeCode.trim().toLowerCase(),
        displayName: displayName.trim(),
      });
      
      toast({
        title: "Locale added successfully",
        description: `${displayName} (${localeCode}) has been added to the project.`,
      });
      
      setLocaleCode("");
      setDisplayName("");
      onClose();
      onSuccess();
      
    } catch (error) {
      toast({
        title: "Failed to add locale",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setLocaleCode("");
      setDisplayName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-locale">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add New Locale
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="locale-code" className="block text-sm font-medium text-foreground mb-2">
              Locale Code
            </Label>
            <Input
              id="locale-code"
              type="text"
              placeholder="e.g., pt, it, ja"
              value={localeCode}
              onChange={(e) => setLocaleCode(e.target.value)}
              disabled={isSubmitting}
              data-testid="input-locale-code"
            />
          </div>
          
          <div>
            <Label htmlFor="display-name" className="block text-sm font-medium text-foreground mb-2">
              Display Name
            </Label>
            <Input
              id="display-name"
              type="text"
              placeholder="e.g., Portuguese, Italian, Japanese"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              data-testid="input-display-name"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            This will copy all translation keys from English (en) with empty values for translation.
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-add-locale"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Adding...' : 'Add Locale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
