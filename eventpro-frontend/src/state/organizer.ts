import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { queryKeys } from "@/state/queryKeys";

export function useOrganizerSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizer.summary,
    queryFn: () => apiService.getOrganizerSummary(),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useOrganizerRecentSalesQuery(limit = 50, enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizer.recentSales(limit),
    queryFn: () => apiService.getOrganizerRecentSales(limit),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useOrganizerTaxFormsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizer.taxForms,
    queryFn: () => apiService.getOrganizerTaxForms(),
    enabled,
  });
}

export function useOrganizerEventsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizer.events,
    queryFn: () => apiService.getOrganizerEvents(),
    enabled,
  });
}

export function useOrganizerInsightsQuery(enabled = true) {
  return useQuery({
    queryKey: ["organizer", "insights"] as const,
    queryFn: () => apiService.getOrganizerInsights(),
    enabled,
  });
}

export function usePublishEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => apiService.publishEvent(eventId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.organizer.events }),
        queryClient.invalidateQueries({ queryKey: queryKeys.organizer.summary }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.root }),
      ]);
    },
  });
}
