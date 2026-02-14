import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { CartResponse, CartItemResponse } from "@/types/api";

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

  const loadLocalCart = () => {
    try {
      const stored = localStorage.getItem("eventpro_cart");
      if (stored) {
        const cartItems = JSON.parse(stored) as CartItem[];
        setItems(cartItems);
      }
    } catch (error) {
      console.error("Failed to load local cart:", error);
    }
  };

  const saveLocalCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem("eventpro_cart", JSON.stringify(cartItems));
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
              id: item.ticketTypeId,
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
        ticketTypeId: ticket.id,
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

  const addItem = (item: Omit<CartItem, "id">) => {
    const newItem: CartItem = {
      ...item,
      id: `${item.ticketTypeId}-${Date.now()}`,
    };

    const existingIndex = items.findIndex((i) => i.ticketTypeId === item.ticketTypeId);
    
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

    toast({
      title: "Added to cart",
      description: `${item.ticketTypeName} added to your cart`,
    });
  };

  const removeItem = (itemId: string) => {
    const updated = items.filter((item) => item.id !== itemId);
    setItems(updated);
    if (!isAuthenticated) saveLocalCart(updated);

    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updated = items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setItems(updated);
    if (!isAuthenticated) saveLocalCart(updated);
  };

  const clearCart = () => {
    setItems([]);
    if (!isAuthenticated) {
      localStorage.removeItem("eventpro_cart");
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
