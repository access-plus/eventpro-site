import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { queryKeys } from "@/state/queryKeys";

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.current,
    queryFn: () => apiService.getMyNotifications(0, 15),
    enabled,
  });
}

export function useNotificationsInfiniteQuery(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["notifications", "pages", pageSize] as const,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => apiService.getMyNotifications(pageParam, pageSize),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length;
      return nextPage < (lastPage.totalPages ?? 1) ? nextPage : undefined;
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.current });
    },
  });
}
