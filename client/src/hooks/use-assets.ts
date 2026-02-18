import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertAsset, Asset } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth-helper";

export function useAssets() {
  return useQuery({
    queryKey: [api.assets.list.path],
    queryFn: async () => {
      const res = await fetch(api.assets.list.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch assets");
      return await res.json() as Asset[];
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAsset) => {
      const res = await fetch(api.admin.assets.create.path, {
        method: api.admin.assets.create.method,
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create asset");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assets.list.path] });
      toast({ title: "Asset created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error creating asset", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InsertAsset>) => {
      const url = buildUrl(api.admin.assets.update.path, { id });
      const res = await fetch(url, {
        method: api.admin.assets.update.method,
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update asset");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assets.list.path] });
      toast({ title: "Asset updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating asset", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.admin.assets.delete.path, { id });
      const res = await fetch(url, {
        method: api.admin.assets.delete.method,
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to delete asset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assets.list.path] });
      toast({ title: "Asset deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting asset", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
