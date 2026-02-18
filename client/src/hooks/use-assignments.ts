import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth-helper";
import { AssetAssignment, Asset, User } from "@shared/schema";

type AssignmentWithDetails = AssetAssignment & { asset: Asset; user: User };

export function useAssignments() {
  return useQuery({
    queryKey: [api.admin.assignments.history.path],
    queryFn: async () => {
      const res = await fetch(api.admin.assignments.history.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return await res.json() as AssignmentWithDetails[];
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { assetId: string; userId: string }) => {
      const res = await fetch(api.admin.assignments.assign.path, {
        method: api.admin.assignments.assign.method,
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to assign asset");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.assignments.history.path] });
      queryClient.invalidateQueries({ queryKey: [api.assets.list.path] });
      toast({ title: "Asset assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error assigning asset", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { assetId: string }) => {
      const res = await fetch(api.admin.assignments.return.path, {
        method: api.admin.assignments.return.method,
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to return asset");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.assignments.history.path] });
      queryClient.invalidateQueries({ queryKey: [api.assets.list.path] });
      toast({ title: "Asset returned successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error returning asset", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
