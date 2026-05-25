import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { apiService } from "@/lib/api";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  apiService: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    removeCartLine: vi.fn(),
    removeFromCart: vi.fn(),
    updateCartLine: vi.fn(),
    updateCartItem: vi.fn(),
    clearCart: vi.fn(),
  },
}));

const TestCartConsumer = () => {
  const { items, itemCount, totalAmount } = useCart();
  return (
    <div>
      <span data-testid="count">{itemCount}</span>
      <span data-testid="total">{totalAmount}</span>
      <span data-testid="rows">{items.length}</span>
      <span data-testid="first">{items[0]?.quantity ?? 0}</span>
    </div>
  );
};

function renderWithCart() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    </QueryClientProvider>
  );
}

describe("CartProvider state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses grouped server cart response as canonical state", async () => {
    vi.mocked(apiService.getCart).mockResolvedValue({
      id: "user-1",
      quantity: 5,
      totalCost: 50,
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
    });

    renderWithCart();

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("5");
    });
    expect(screen.getByTestId("total")).toHaveTextContent("50");
    expect(screen.getByTestId("rows")).toHaveTextContent("1");
    expect(screen.getByTestId("first")).toHaveTextContent("5");
  });
});
