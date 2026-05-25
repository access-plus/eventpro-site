import type { CartItemResponse, CartResponse, Event } from "@/types/api";

export type CartLineType = "GENERAL_ADMISSION" | "RESERVED_SEAT";

export interface CanonicalCartItem {
  id: string;
  lineId: string;
  lineType: CartLineType;
  ticketTypeId: string;
  ticketTypeName: string;
  eventName: string;
  eventId: string;
  quantity: number;
  price: number;
  ticketIds: string[];
}

export interface CanonicalCart {
  id: string;
  items: CanonicalCartItem[];
  itemCount: number;
  totalAmount: number;
  reservedUntil?: string;
  message?: string;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function mapCartItem(ticket: CartItemResponse): CanonicalCartItem {
  const ticketIds = (ticket.ticketIds?.length ? ticket.ticketIds : [ticket.id]).filter(Boolean);
  const lineType = (ticket.lineType ?? "GENERAL_ADMISSION") as CartLineType;
  const ticketTypeId = lineType === "RESERVED_SEAT" ? ticket.id : ticket.ticketType ?? ticket.id;

  return {
    id: ticket.lineId ?? ticket.id,
    lineId: ticket.lineId ?? ticket.id,
    lineType,
    ticketTypeId,
    ticketTypeName: ticket.name,
    eventName: ticket.name,
    eventId: ticket.eventIdType || "",
    quantity: ticket.quantity ?? ticketIds.length,
    price: toNumber(ticket.price),
    ticketIds,
  };
}

export function mapCartResponse(response?: CartResponse | null): CanonicalCart {
  const items = (response?.tickets ?? []).map(mapCartItem);
  return {
    id: response?.id ?? "",
    items,
    itemCount: response?.quantity ?? items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: toNumber(response?.totalCost) || items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    reservedUntil: response?.reservedUntil,
    message: response?.message,
  };
}

export function normalizeEvent(event: Event): Event {
  return {
    ...event,
    startTime: event.startTime || event.startDateTime || "",
    endTime: event.endTime || event.endDateTime || "",
    startDateTime: event.startDateTime || event.startTime,
    endDateTime: event.endDateTime || event.endTime,
  };
}
