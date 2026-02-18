import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Box, 
  Users, 
  ClipboardList, 
  FileText, 
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Lottie from "lottie-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [animationData, setAnimationData] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/assetflow-splash.json", { cache: "force-cache" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setAnimationData(json);
      } catch {
        // ignore, fallback to text logo only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const navItems = isAdmin
    ? [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Assets", href: "/assets", icon: Box },
        { label: "Assignments", href: "/assignments", icon: ClipboardList },
        { label: "Users", href: "/users", icon: Users },
        { label: "Reports", href: "/reports", icon: FileText },
      ]
    : [{ label: "My Assets", href: "/my-assets", icon: Box }];

  return (
    <div className="h-screen w-64 bg-white dark:bg-zinc-900 border-r border-border flex flex-col sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          {animationData ? (
            <Lottie animationData={animationData} loop autoplay />
          ) : (
            <span className="text-lg font-bold text-white">AF</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg tracking-tight">AssetFlow</span>
          <span className="text-xs text-muted-foreground">Pro Management</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              {user?.role}
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 border-red-100 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/20"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
