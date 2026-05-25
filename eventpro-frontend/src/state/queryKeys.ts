export const queryKeys = {
  auth: {
    currentUser: ["auth", "currentUser"] as const,
  },
  cart: {
    root: ["cart"] as const,
    current: ["cart", "current"] as const,
  },
  events: {
    root: ["events"] as const,
    detail: (eventId: string) => ["events", "detail", eventId] as const,
    ticketTypes: (eventId: string) => ["events", "ticketTypes", eventId] as const,
    seats: (eventId: string) => ["events", "seats", eventId] as const,
    byOrganizer: (organizerId: string) => ["events", "organizer", organizerId] as const,
  },
  checkout: {
    totals: (subtotal: number, state?: string, country?: string) =>
      ["checkout", "totals", subtotal, state ?? "", country ?? ""] as const,
  },
  notifications: {
    current: ["notifications", "current"] as const,
  },
  organizer: {
    summary: ["organizer", "summary"] as const,
    recentSales: (limit: number) => ["organizer", "recentSales", limit] as const,
    taxForms: ["organizer", "taxForms"] as const,
    financials: ["organizer", "financials"] as const,
    events: ["organizer", "events"] as const,
  },
};
