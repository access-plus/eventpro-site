/**
 * Mobile cart: guest (AsyncStorage) or logged-in (API).
 * Matches web CartContext — guest persistence, reservedUntil, sync on login.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import type { TicketTypeEnum } from "@eventpro/shared";
import { formatTicketTypeName } from "@eventpro/shared";

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
  /** ISO-8601 expiry from server cart (authenticated users). */
  reservedUntil: string | null;
  addItem: (item: Omit<CartItem, "id">) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const GUEST_CART_KEY = "eventpro_cart";
const GUEST_CART_SAVED_AT_KEY = "eventpro_cart_saved_at";
const GUEST_CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { api, user } = useAuth();
  const isAuthenticated = !!user;
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);

  const setCartItems = useCallback((cartItems: CartItem[]) => {
    itemsRef.current = cartItems;
    setItems(cartItems);
  }, []);

  const loadLocalCart = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(GUEST_CART_KEY);
      const savedAtRaw = await AsyncStorage.getItem(GUEST_CART_SAVED_AT_KEY);
      if (!stored) return;
      const savedAt = savedAtRaw ? parseInt(savedAtRaw, 10) : NaN;
      if (!savedAtRaw || Number.isNaN(savedAt)) {
        await AsyncStorage.multiRemove([GUEST_CART_KEY, GUEST_CART_SAVED_AT_KEY]);
        setCartItems([]);
        return;
      }
      if (Date.now() - savedAt > GUEST_CART_MAX_AGE_MS) {
        await AsyncStorage.multiRemove([GUEST_CART_KEY, GUEST_CART_SAVED_AT_KEY]);
        setCartItems([]);
        return;
      }
      setCartItems(JSON.parse(stored) as CartItem[]);
    } catch {
      await AsyncStorage.multiRemove([GUEST_CART_KEY, GUEST_CART_SAVED_AT_KEY]);
      setCartItems([]);
    }
  }, [setCartItems]);

  const saveLocalCart = useCallback(async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
      await AsyncStorage.setItem(GUEST_CART_SAVED_AT_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const cartData = await api.getCart();
      const mapped: CartItem[] = (cartData.tickets ?? []).map(
        (t: { id: string; name: string; ticketType?: string; eventIdType?: string; quantity: number; price: number }) => {
          const ticketTypeId = t.ticketType ?? t.id;
          const existing = itemsRef.current.find(
            (i) => i.eventId === (t.eventIdType ?? "") && i.ticketTypeId === ticketTypeId
          );
          return {
            id: t.id,
            ticketTypeId,
            ticketTypeName: formatTicketTypeName(existing?.ticketTypeName ?? t.name),
            eventName: existing?.eventName ?? t.name,
            eventId: t.eventIdType ?? "",
            quantity: t.quantity,
            price: Number(t.price),
          };
        }
      );
      setCartItems(mapped);
      setReservedUntil(cartData.reservedUntil ?? null);
    } catch {
      setCartItems([]);
      setReservedUntil(null);
    } finally {
      setIsLoading(false);
    }
  }, [api, isAuthenticated, setCartItems]);

  const syncCartOnAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const localCart = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (localCart) {
        const localItems = JSON.parse(localCart) as CartItem[];
        for (const item of localItems) {
          try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.ticketTypeId);
            await api.addToCart(
              isUuid
                ? { id: item.ticketTypeId, quantity: item.quantity }
                : { eventIdType: item.eventId, ticketType: item.ticketTypeId as TicketTypeEnum, quantity: item.quantity }
            );
          } catch {
            // continue syncing other items
          }
        }
        await AsyncStorage.multiRemove([GUEST_CART_KEY, GUEST_CART_SAVED_AT_KEY]);
      }
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  }, [api, refreshCart]);

  useEffect(() => {
    if (isAuthenticated) {
      void syncCartOnAuth();
    } else {
      setReservedUntil(null);
      void loadLocalCart();
    }
  }, [isAuthenticated, syncCartOnAuth, loadLocalCart]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "id">): Promise<boolean> => {
      const newItem: CartItem = {
        ...item,
        id: `${item.ticketTypeId}-${item.eventId}-${Date.now()}`,
      };
      const existingIndex = itemsRef.current.findIndex(
        (i) => i.eventId === item.eventId && i.ticketTypeId === item.ticketTypeId
      );
      let updated: CartItem[];
      if (existingIndex >= 0) {
        updated = itemsRef.current.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        updated = [...itemsRef.current, newItem];
      }
      setCartItems(updated);
      if (!isAuthenticated) {
        await saveLocalCart(updated);
        return true;
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
        return true;
      } catch {
        await refreshCart();
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [api, isAuthenticated, refreshCart, saveLocalCart, setCartItems]
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      const updated = itemsRef.current.filter((i) => i.id !== itemId);
      setCartItems(updated);
      if (!isAuthenticated) {
        await saveLocalCart(updated);
        return true;
      }
      try {
        await api.removeFromCart(itemId);
        await refreshCart();
        return true;
      } catch {
        await refreshCart();
        return false;
      }
    },
    [api, isAuthenticated, refreshCart, saveLocalCart, setCartItems]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      if (quantity <= 0) return removeItem(itemId);
      const updated = itemsRef.current.map((i) => (i.id === itemId ? { ...i, quantity } : i));
      setCartItems(updated);
      if (!isAuthenticated) {
        await saveLocalCart(updated);
        return true;
      }
      try {
        await api.updateCartItem(itemId, { quantity });
        await refreshCart();
        return true;
      } catch {
        await refreshCart();
        return false;
      }
    },
    [api, isAuthenticated, refreshCart, removeItem, saveLocalCart, setCartItems]
  );

  const clearCart = useCallback(async () => {
    setCartItems([]);
    setReservedUntil(null);
    if (!isAuthenticated) {
      await AsyncStorage.multiRemove([GUEST_CART_KEY, GUEST_CART_SAVED_AT_KEY]);
      return;
    }
    try {
      await api.clearCart();
    } catch {
      const cart = await api.getCart().catch(() => null);
      if (cart?.tickets) {
        for (const t of cart.tickets) {
          await api.removeFromCart(t.id).catch(() => {});
        }
      }
    }
  }, [api, isAuthenticated, setCartItems]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const value: CartContextValue = {
    items,
    itemCount,
    totalAmount,
    isLoading,
    reservedUntil,
    addItem,
    removeItem,
    updateQuantity,
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
