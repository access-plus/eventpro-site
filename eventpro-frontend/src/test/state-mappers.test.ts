import { describe, expect, it } from "vitest";
import { mapCartResponse, normalizeEvent } from "@/state/mappers";
import type { CartResponse, Event } from "@/types/api";

describe("state mappers", () => {
  it("maps grouped cart responses into canonical cart items", () => {
    const cart = mapCartResponse({
      id: "user-1",
      quantity: 5,
      totalCost: 50,
      reservedUntil: "2026-05-22T22:00:00Z",
      tickets: [
        {
          id: "ticket-1",
          lineId: "event-1:REGULAR:10.00",
          lineType: "GENERAL_ADMISSION",
          name: "REGULAR Ticket",
          ticketType: "REGULAR",
          ticketStatus: "RESERVED",
          price: 10,
          eventIdType: "event-1",
          quantity: 5,
          ticketIds: ["ticket-1", "ticket-2", "ticket-3", "ticket-4", "ticket-5"],
        },
      ],
    } as CartResponse);

    expect(cart.itemCount).toBe(5);
    expect(cart.totalAmount).toBe(50);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      id: "event-1:REGULAR:10.00",
      lineType: "GENERAL_ADMISSION",
      ticketTypeId: "REGULAR",
      eventId: "event-1",
      quantity: 5,
    });
    expect(cart.items[0].ticketIds).toHaveLength(5);
  });

  it("falls back for legacy cart responses without line ids", () => {
    const cart = mapCartResponse({
      id: "user-1",
      quantity: 1,
      totalCost: 10,
      tickets: [
        {
          id: "ticket-1",
          name: "REGULAR Ticket",
          ticketType: "REGULAR",
          ticketStatus: "RESERVED",
          price: 10,
          eventIdType: "event-1",
          quantity: 1,
        },
      ],
    } as CartResponse);

    expect(cart.items[0].id).toBe("ticket-1");
    expect(cart.items[0].ticketIds).toEqual(["ticket-1"]);
  });

  it("normalizes event date aliases at the boundary", () => {
    const event = normalizeEvent({
      id: "event-1",
      name: "Test Event",
      startTime: "",
      endTime: "",
      startDateTime: "2026-05-22T20:00:00Z",
      endDateTime: "2026-05-22T22:00:00Z",
      createdAt: "",
      updatedAt: "",
    } as Event);

    expect(event.startTime).toBe("2026-05-22T20:00:00Z");
    expect(event.endTime).toBe("2026-05-22T22:00:00Z");
  });
});
