import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import Assignments from "@/pages/Assignments";
import Users from "@/pages/Users";
import Reports from "@/pages/Reports";
import MyAssets from "@/pages/MyAssets";
import Sidebar from "@/components/Sidebar";
import NotFound from "@/pages/not-found";
import SplashScreen from "@/components/SplashScreen";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (adminOnly && user.role !== "ADMIN") {
    return <NotFound />; // Or Access Denied page
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} adminOnly />
      </Route>
      
      <Route path="/assets">
        <ProtectedRoute component={Assets} adminOnly />
      </Route>
      
      <Route path="/assignments">
        <ProtectedRoute component={Assignments} adminOnly />
      </Route>
      
      <Route path="/users">
        <ProtectedRoute component={Users} adminOnly />
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute component={Reports} adminOnly />
      </Route>

      <Route path="/my-assets">
        <ProtectedRoute component={MyAssets} />
      </Route>

      <Route path="/">
        {user ? (
          user.role === "ADMIN" ? (
            <ProtectedRoute component={Dashboard} adminOnly />
          ) : (
            <ProtectedRoute component={MyAssets} />
          )
        ) : (
          <Login />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem("assetflow:splashSeen") !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!showSplash) return;
    try {
      sessionStorage.setItem("assetflow:splashSeen", "1");
    } catch {
      // ignore
    }
  }, [showSplash]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {showSplash ? (
          <SplashScreen onDone={() => setShowSplash(false)} />
        ) : (
          <Router />
        )}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
