import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { User, LoginRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: any;
  logoutMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  // Fetch current user
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch(api.auth.me.path, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        setToken(null);
        localStorage.removeItem("token");
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      
      return await res.json(); // Returns { token, user }
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
      // Send admins to dashboard, regular users to their assets
      if (data.user.role === "ADMIN") {
        setLocation("/dashboard");
      } else {
        setLocation("/my-assets");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Client-side only logout for JWT usually, unless using blacklist
      return Promise.resolve();
    },
    onSuccess: () => {
      setToken(null);
      localStorage.removeItem("token");
      queryClient.setQueryData(["/api/auth/me"], null);
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "See you next time",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
