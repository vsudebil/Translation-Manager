import React, { useCallback, useEffect, useState } from "react";
import { Router as WouterRouter, Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TranslationManager from "@/pages/translation-manager";

// Hash-based location hook for wouter (works with GitHub Pages)
const hashLocation = (): [string, (to: string, replace?: boolean) => void] => {
  const [location, setLocation] = useState(() => window.location.hash.replace("#", "") || "/");

  useEffect(() => {
    const handler = () => setLocation(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", handler);
    handler(); // set initial location
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((to: string, replace?: boolean) => {
    if (replace) {
      const hash = to ? `#${to}` : "#";
      const newUrl = window.location.href.replace(/(#[^]*)?$/, hash);
      window.history.replaceState(null, "", newUrl);
      // update local state as well
      setLocation(to || "/");
    } else {
      window.location.hash = to;
    }
  }, []);

  return [location, navigate];
};

function Router() {
  return (
    <WouterRouter hook={hashLocation}>
      <Switch>
        <Route path="/" component={TranslationManager} />
        <Route path="/project/:id" component={TranslationManager} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
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
