/**
 * Mobile cart: guest (in-memory) or logged-in (API).
 * Matches web behavior so guests can add to cart and checkout without an account.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { TicketTypeEnum } from "@eventpro/shared";

export interface CartItem {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  eventName: string;
  eventId: string;
  quantity: number;
  price: number;
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);


export function CartProvider({ children }: { children: React.ReactNode }) {
  const { api, user } = useAuth();
  const isAuthenticated = !!user;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Guest cart is in-memory only; nothing to load
      return;
    }
    setIsLoading(true);
    try {
      const cartData = await api.getCart();
      const mapped: CartItem[] = (cartData.tickets ?? []).map((t: { id: string; name: string; ticketType?: string; eventIdType?: string; quantity: number; price: number }) => ({
        id: t.id,
        ticketTypeId: t.ticketType ?? t.id,
        ticketTypeName: t.name,
        eventName: t.name,
        eventId: t.eventIdType ?? "",
        quantity: t.quantity,
        price: Number(t.price),
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [api, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) refreshCart();
  }, [isAuthenticated, refreshCart]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "id">) => {
      const newItem: CartItem = {
        ...item,
        id: `${item.ticketTypeId}-${item.eventId}-${Date.now()}`,
      };
      if (!isAuthenticated) {
        setItems((prev) => {
          const existingIndex = prev.findIndex((i) => i.eventId === item.eventId && i.ticketTypeId === item.ticketTypeId);
          return existingIndex >= 0
            ? prev.map((i, idx) => (idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i))
            : [...prev, newItem];
        });
        return;
      }
      setIsLoading(true);
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.ticketTypeId);
        await api.addToCart(
          isUuid
            ? { id: item.ticketTypeId, quantity: item.quantity }
            : { eventIdType: item.eventId, ticketType: item.ticketTypeId as TicketTypeEnum, quantity: item.quantity }
        );
        await refreshCart();
      } catch (e) {
        console.warn("Add to cart failed", e);
        await refreshCart();
      } finally {
        setIsLoading(false);
      }
    },
    [api, isAuthenticated, refreshCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        return;
      }
      try {
        await api.removeFromCart(itemId);
        await refreshCart();
      } catch {
        await refreshCart();
      }
    },
    [api, isAuthenticated, refreshCart]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    if (isAuthenticated) {
      try {
        const cart = await api.getCart();
        for (const t of cart.tickets ?? []) {
          await api.removeFromCart(t.id);
        }
      } catch {
        // ignore
      }
    }
  }, [api, isAuthenticated]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const value: CartContextValue = {
    items,
    itemCount,
    totalAmount,
    isLoading,
    addItem,
    removeItem,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
