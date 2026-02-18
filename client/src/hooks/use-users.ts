import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertUser, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth-helper";

export function useUsers() {
  return useQuery({
    queryKey: [api.admin.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.users.list.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json() as User[];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.admin.users.create.path, {
        method: api.admin.users.create.method,
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] });
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error creating user", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.admin.users.deactivate.path, { id });
      const res = await fetch(url, {
        method: api.admin.users.deactivate.method,
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to deactivate user");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.list.path] });
      toast({ title: "User deactivated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deactivating user", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
