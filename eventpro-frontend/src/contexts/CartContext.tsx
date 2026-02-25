import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { CartResponse, CartItemResponse, TicketTypeEnum } from "@/types/api";

interface CartItem {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  eventName: string;
  eventId: string;
  quantity: number;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      syncCartOnAuth();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated]);

  const GUEST_CART_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  const loadLocalCart = () => {
    try {
      const stored = localStorage.getItem("eventpro_cart");
      const savedAtRaw = localStorage.getItem("eventpro_cart_saved_at");
      if (!stored) return;
      const savedAt = savedAtRaw ? parseInt(savedAtRaw, 10) : NaN;
      if (!savedAtRaw || Number.isNaN(savedAt)) {
        localStorage.removeItem("eventpro_cart");
        localStorage.removeItem("eventpro_cart_saved_at");
        setItems([]);
        return;
      }
      const age = Date.now() - savedAt;
      if (age > GUEST_CART_MAX_AGE_MS) {
        localStorage.removeItem("eventpro_cart");
        localStorage.removeItem("eventpro_cart_saved_at");
        setItems([]);
        return;
      }
      const cartItems = JSON.parse(stored) as CartItem[];
      setItems(cartItems);
    } catch (error) {
      console.error("Failed to load local cart:", error);
      localStorage.removeItem("eventpro_cart");
      localStorage.removeItem("eventpro_cart_saved_at");
      setItems([]);
    }
  };

  const saveLocalCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem("eventpro_cart", JSON.stringify(cartItems));
      localStorage.setItem("eventpro_cart_saved_at", String(Date.now()));
    } catch (error) {
      console.error("Failed to save local cart:", error);
    }
  };

  const syncCartOnAuth = async () => {
    setIsLoading(true);
    try {
      const localCart = localStorage.getItem("eventpro_cart");
      if (localCart) {
        const localItems = JSON.parse(localCart) as CartItem[];
        for (const item of localItems) {
          try {
            await apiService.addToCart({
              eventIdType: item.eventId,
              ticketType: item.ticketTypeId as TicketTypeEnum,
              quantity: item.quantity,
            });
          } catch (error) {
            console.error("Failed to sync cart item:", error);
          }
        }
        localStorage.removeItem("eventpro_cart");
      }
      await refreshCart();
    } catch (error) {
      console.error("Failed to sync cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const cartData = await apiService.getCart();
      const mappedItems: CartItem[] = cartData.tickets.map((ticket: CartItemResponse) => ({
        id: ticket.id,
        ticketTypeId: ticket.ticketType ?? ticket.id,
        ticketTypeName: ticket.name,
        eventName: ticket.name,
        eventId: ticket.eventIdType || "",
        quantity: ticket.quantity,
        price: ticket.price,
      }));
      setItems(mappedItems);
    } catch (error) {
      console.error("Failed to refresh cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (item: Omit<CartItem, "id">) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.ticketTypeId}-${Date.now()}`,
    };

    const existingIndex = items.findIndex(
      (i) => i.eventId === item.eventId && i.ticketTypeId === item.ticketTypeId
    );

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += item.quantity;
      setItems(updated);
      if (!isAuthenticated) saveLocalCart(updated);
    } else {
      const updated = [...items, newItem];
      setItems(updated);
      if (!isAuthenticated) saveLocalCart(updated);
    }

    if (isAuthenticated) {
      try {
        await apiService.addToCart({
          eventIdType: item.eventId,
          ticketType: item.ticketTypeId as TicketTypeEnum,
          quantity: item.quantity,
        });
        await refreshCart();
      } catch (error) {
        console.error("Failed to add to cart:", error);
        await refreshCart(); // revert to server state
        toast({
          title: "Could not add to cart",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Added to cart",
      description: `${item.ticketTypeName} added to your cart`,
    });
  };

  const removeItem = async (itemId: string) => {
    const updated = items.filter((item) => item.id !== itemId);
    setItems(updated);
    if (!isAuthenticated) {
      saveLocalCart(updated);
    } else {
      try {
        await apiService.removeFromCart(itemId);
        await refreshCart();
      } catch (error) {
        console.error("Failed to remove from cart:", error);
        await refreshCart();
        toast({
          title: "Could not remove item",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    const updated = items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setItems(updated);
    if (!isAuthenticated) {
      saveLocalCart(updated);
    } else {
      try {
        await apiService.updateCartItem(itemId, { quantity });
        await refreshCart();
      } catch (error) {
        console.error("Failed to update quantity:", error);
        await refreshCart();
        toast({
          title: "Could not update quantity",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const clearCart = () => {
    setItems([]);
    if (!isAuthenticated) {
      localStorage.removeItem("eventpro_cart");
      localStorage.removeItem("eventpro_cart_saved_at");
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
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
