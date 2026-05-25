import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";

export const adminQueryKeys = {
  stats: ["admin", "stats"] as const,
  users: (page: number, size: number) => ["admin", "users", page, size] as const,
  events: (page: number, size: number) => ["admin", "events", page, size] as const,
  system: ["admin", "system"] as const,
};

export function useAdminStatsQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.stats,
    queryFn: () => apiService.getStats(),
    enabled,
  });
}

export function useAdminUsersQuery(enabled: boolean, page = 1, size = 10) {
  return useQuery({
    queryKey: adminQueryKeys.users(page, size),
    queryFn: () => apiService.getUsersPage(page, size),
    enabled,
  });
}

export function useAdminEventsQuery(enabled: boolean, page = 1, size = 10) {
  return useQuery({
    queryKey: adminQueryKeys.events(page, size),
    queryFn: () => apiService.getEventsPage(page, size),
    enabled,
  });
}

export function useAdminSystemStatusQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminQueryKeys.system,
    queryFn: () => apiService.getSystemStatus(),
    enabled,
    refetchInterval: 30_000,
  });
}
