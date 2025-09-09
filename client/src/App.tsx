import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TranslationManager from "@/pages/translation-manager";

function Router() {
  return (
    <Switch>
      <Route path="/Translation-Manager" component={TranslationManager} />
      <Route path="/Translation-Manager/project/:id" component={TranslationManager} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
