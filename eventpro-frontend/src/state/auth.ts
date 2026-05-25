import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { queryKeys } from "@/state/queryKeys";
import { appStorage } from "@/state/storage";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => apiService.getCurrentUser(),
    enabled: Boolean(appStorage.getAccessToken()),
    retry: false,
  });
}
