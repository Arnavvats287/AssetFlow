import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeader } from "@/lib/auth-helper";
import type { AssetAssignment, Asset } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export type MyAssetAssignment = AssetAssignment & { asset: Asset };

export function useMyAssets() {
  const { user } = useAuth();

  return useQuery({
    // include user id in key so each user has separate cache
    queryKey: [api.user.assets.list.path, user?.id],
    queryFn: async () => {
      const res = await fetch(api.user.assets.list.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch your assets");
      }
      return (await res.json()) as MyAssetAssignment[];
    },
    enabled: !!user, // wait until user is loaded
  });
}

export function useRequestReturn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { assetId: string }) => {
      const res = await fetch(api.user.assets.requestReturn.path, {
        method: api.user.assets.requestReturn.method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to request return");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.assets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.assignments.history.path] });
      toast({ title: "Return requested", description: "An admin will review your request." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error requesting return",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

