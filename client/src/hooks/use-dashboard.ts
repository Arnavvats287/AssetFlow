import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getAuthHeader } from "@/lib/auth-helper";

export function useDashboardStats() {
  return useQuery({
    queryKey: [api.admin.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.dashboard.stats.path, {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json() as {
        totalAssets: number;
        assignedAssets: number;
        availableAssets: number;
        maintenanceAssets: number;
      };
    },
  });
}
