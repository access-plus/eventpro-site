import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { queryKeys } from "@/state/queryKeys";
import { normalizeEvent } from "@/state/mappers";

export function useEventQuery(eventId?: string) {
  return useQuery({
    queryKey: eventId ? queryKeys.events.detail(eventId) : ["events", "detail", "missing"],
    queryFn: async () => normalizeEvent(await apiService.getEvent(eventId!)),
    enabled: !!eventId,
  });
}

export function useTicketTypesQuery(eventId?: string) {
  return useQuery({
    queryKey: eventId ? queryKeys.events.ticketTypes(eventId) : ["events", "ticketTypes", "missing"],
    queryFn: () => apiService.getTicketTypes(eventId!),
    enabled: !!eventId,
    refetchInterval: 15_000,
  });
}

export function useEventSeatsQuery(eventId?: string, enabled = true) {
  return useQuery({
    queryKey: eventId ? queryKeys.events.seats(eventId) : ["events", "seats", "missing"],
    queryFn: () => apiService.getEventSeats(eventId!),
    enabled: !!eventId && enabled,
    refetchInterval: 15_000,
  });
}

export function useOrganizerEventsQuery(organizerId?: string) {
  return useQuery({
    queryKey: organizerId ? queryKeys.events.byOrganizer(organizerId) : ["events", "organizer", "missing"],
    queryFn: () => apiService.getEvents(1, 6, undefined, organizerId),
    enabled: !!organizerId,
  });
}
