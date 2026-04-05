/**
 * Order API returns line items as `orderItems` with nested `ticket`; the ticket's event id is
 * often exposed as `eventIdType` (legacy). Flat `tickets` arrays may use `eventId` directly.
 */
export function getEventIdFromOrderLineItem(item: unknown): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const o = item as Record<string, unknown>;
  if (typeof o.eventId === "string" && o.eventId) return o.eventId;
  if (typeof o.eventIdType === "string" && o.eventIdType) return o.eventIdType;
  const nested = o.ticket;
  if (nested && typeof nested === "object") {
    const t = nested as Record<string, unknown>;
    if (typeof t.eventId === "string" && t.eventId) return t.eventId;
    if (typeof t.eventIdType === "string" && t.eventIdType) return t.eventIdType;
  }
  return undefined;
}
