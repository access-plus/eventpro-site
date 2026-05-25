import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { CartResponse, TicketTypeEnum } from "@/types/api";
import { mapCartResponse, type CanonicalCartItem } from "@/state/mappers";
import { queryKeys } from "@/state/queryKeys";
import { appStorage } from "@/state/storage";

interface CartItem extends CanonicalCartItem {}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  reservedUntil?: string;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "id" | "lineId" | "lineType" | "ticketIds">) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function toGuestCartItem(item: Omit<CartItem, "id" | "lineId" | "lineType" | "ticketIds">): CartItem {
  const lineType = isUuid(item.ticketTypeId) ? "RESERVED_SEAT" : "GENERAL_ADMISSION";
  const lineId = lineType === "RESERVED_SEAT"
    ? item.ticketTypeId
    : `${item.eventId}:${item.ticketTypeId}:${item.price}`;
  return {
    ...item,
    id: lineId,
    lineId,
    lineType,
    ticketIds: lineType === "RESERVED_SEAT" ? [item.ticketTypeId] : [],
  };
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.current,
    queryFn: () => apiService.getCart(),
    enabled: isAuthenticated,
  });

  const serverCart = useMemo(() => mapCartResponse(cartQuery.data), [cartQuery.data]);
  const items = isAuthenticated ? serverCart.items : guestItems;

  const invalidateCartDependents = async (eventIds: string[]) => {
    const uniqueEventIds = Array.from(new Set(eventIds.filter(Boolean)));
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
    await Promise.all(
      uniqueEventIds.flatMap((eventId) => [
        queryClient.invalidateQueries({ queryKey: queryKeys.events.ticketTypes(eventId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.seats(eventId) }),
      ])
    );
  };

  const setCartResponse = (response: CartResponse) => {
    queryClient.setQueryData(queryKeys.cart.current, response);
  };

  const loadLocalCart = () => {
    try {
      const stored = localStorage.getItem(appStorage.keys.guestCart);
      const savedAtRaw = localStorage.getItem(appStorage.keys.guestCartSavedAt);
      if (!stored) return;
      const savedAt = savedAtRaw ? parseInt(savedAtRaw, 10) : NaN;
      if (!savedAtRaw || Number.isNaN(savedAt) || Date.now() - savedAt > GUEST_CART_MAX_AGE_MS) {
        appStorage.clearGuestCart();
        setGuestItems([]);
        return;
      }
      setGuestItems(JSON.parse(stored) as CartItem[]);
    } catch (error) {
      console.error("Failed to load local cart:", error);
      appStorage.clearGuestCart();
      setGuestItems([]);
    }
  };

  const saveLocalCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem(appStorage.keys.guestCart, JSON.stringify(cartItems));
      localStorage.setItem(appStorage.keys.guestCartSavedAt, String(Date.now()));
    } catch (error) {
      console.error("Failed to save local cart:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      loadLocalCart();
      return;
    }

    const syncGuestCart = async () => {
      const localCart = localStorage.getItem(appStorage.keys.guestCart);
      if (!localCart) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
        return;
      }

      const localItems = JSON.parse(localCart) as CartItem[];
      const eventIds = localItems.map((item) => item.eventId);
      for (const item of localItems) {
        try {
          await apiService.addToCart(
            item.lineType === "RESERVED_SEAT" || isUuid(item.ticketTypeId)
              ? { id: item.ticketTypeId, quantity: 1 }
              : { eventIdType: item.eventId, ticketType: item.ticketTypeId as TicketTypeEnum, quantity: item.quantity }
          );
        } catch (error) {
          console.error("Failed to sync cart item:", error);
        }
      }
      appStorage.clearGuestCart();
      setGuestItems([]);
      await invalidateCartDependents(eventIds);
    };

    void syncGuestCart();
  }, [isAuthenticated]);

  const addMutation = useMutation({
    mutationFn: async (item: Omit<CartItem, "id" | "lineId" | "lineType" | "ticketIds">) => {
      return apiService.addToCart(
        isUuid(item.ticketTypeId)
          ? { id: item.ticketTypeId, quantity: 1 }
          : { eventIdType: item.eventId, ticketType: item.ticketTypeId as TicketTypeEnum, quantity: item.quantity }
      );
    },
    onSuccess: async (response, item) => {
      setCartResponse(response);
      await invalidateCartDependents([item.eventId]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      if (item.lineType === "GENERAL_ADMISSION" && item.eventId && item.ticketTypeId) {
        return apiService.removeCartLine(item.eventId, item.ticketTypeId as TicketTypeEnum);
      }
      return apiService.removeFromCart(item.ticketIds[0] ?? item.id);
    },
    onSuccess: async (response, item) => {
      setCartResponse(response);
      await invalidateCartDependents([item.eventId]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: CartItem; quantity: number }) => {
      if (item.lineType === "GENERAL_ADMISSION") {
        return apiService.updateCartLine({
          eventIdType: item.eventId,
          ticketType: item.ticketTypeId as TicketTypeEnum,
          quantity,
        });
      }
      if (quantity <= 0) {
        return apiService.removeFromCart(item.ticketIds[0] ?? item.id);
      }
      if (quantity !== 1) {
        throw new Error("Reserved seats can only have quantity 1");
      }
      return apiService.updateCartItem(item.ticketIds[0] ?? item.id, { quantity: 1 });
    },
    onSuccess: async (response, { item }) => {
      setCartResponse(response);
      await invalidateCartDependents([item.eventId]);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiService.clearCart(),
    onSuccess: async (response) => {
      setCartResponse(response);
      const eventIds = items.map((item) => item.eventId);
      await invalidateCartDependents(eventIds);
    },
  });

  const addItem = async (item: Omit<CartItem, "id" | "lineId" | "lineType" | "ticketIds">): Promise<boolean> => {
    if (!isAuthenticated) {
      const newItem = toGuestCartItem(item);
      setGuestItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.lineId === newItem.lineId);
        const next = [...prev];
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + item.quantity,
          };
        } else {
          next.push(newItem);
        }
        saveLocalCart(next);
        return next;
      });
      toast({ title: "Added to cart", description: `${item.ticketTypeName} added to your cart` });
      return true;
    }

    try {
      await addMutation.mutateAsync(item);
      toast({ title: "Added to cart", description: `${item.ticketTypeName} added to your cart` });
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      await invalidateCartDependents([item.eventId]);
      toast({
        title: "Could not reserve tickets",
        description: "Ticket availability changed. Please review the latest quantity.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    const item = items.find((cartItem) => cartItem.id === itemId || cartItem.lineId === itemId);
    if (!item) return false;

    if (!isAuthenticated) {
      const updated = guestItems.filter((cartItem) => cartItem.lineId !== item.lineId);
      setGuestItems(updated);
      saveLocalCart(updated);
      toast({ title: "Removed from cart", description: "Item removed from your cart" });
      return true;
    }

    try {
      await removeMutation.mutateAsync(item);
      toast({ title: "Removed from cart", description: "Item removed from your cart" });
      return true;
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      await invalidateCartDependents([item.eventId]);
      toast({
        title: "Could not remove item",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    const item = items.find((cartItem) => cartItem.id === itemId || cartItem.lineId === itemId);
    if (!item) return false;

    if (!isAuthenticated) {
      if (quantity <= 0) return removeItem(itemId);
      const updated = guestItems.map((cartItem) =>
        cartItem.lineId === item.lineId ? { ...cartItem, quantity } : cartItem
      );
      setGuestItems(updated);
      saveLocalCart(updated);
      return true;
    }

    try {
      await updateMutation.mutateAsync({ item, quantity });
      return true;
    } catch (error) {
      console.error("Failed to update quantity:", error);
      await invalidateCartDependents([item.eventId]);
      toast({
        title: "Could not update quantity",
        description: "Ticket availability changed. Please review the latest cart.",
        variant: "destructive",
      });
      return false;
    }
  };

  const clearCart = () => {
    if (!isAuthenticated) {
      setGuestItems([]);
      appStorage.clearGuestCart();
      return;
    }
    void clearMutation.mutateAsync().catch((error) => {
      console.error("Failed to clear cart:", error);
    });
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
      await cartQuery.refetch();
    }
  };

  const itemCount = isAuthenticated
    ? serverCart.itemCount
    : guestItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = isAuthenticated
    ? serverCart.totalAmount
    : guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isLoading =
    cartQuery.isLoading ||
    addMutation.isPending ||
    removeMutation.isPending ||
    updateMutation.isPending ||
    clearMutation.isPending;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        reservedUntil: isAuthenticated ? serverCart.reservedUntil : undefined,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
