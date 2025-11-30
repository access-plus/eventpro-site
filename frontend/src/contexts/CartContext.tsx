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
      // When user authenticates, sync local cart with backend
      syncCartOnAuth();
    } else {
      // Load from localStorage for non-authenticated users
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
      console.error("Failed to load cart from localStorage:", error);
    }
  };

  const saveLocalCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem("eventpro_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  };

  // Transform backend CartResponse to frontend CartItem format
  const transformCartResponse = (cartData: CartResponse): CartItem[] => {
    if (!cartData?.tickets || cartData.tickets.length === 0) {
      return [];
    }

    return cartData.tickets.map((ticket: CartItemResponse) => ({
      id: ticket.id,
      ticketTypeId: ticket.id, // Using ticket ID as ticketTypeId for now
      ticketTypeName: ticket.name || ticket.ticketType || "Ticket",
      eventName: "", // Will need to fetch from event if needed
      eventId: ticket.eventIdType || "",
      quantity: ticket.quantity,
      price: Number(ticket.price),
    }));
  };

  const refreshCart = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const cartData = await apiService.getCart();
      const transformedItems = transformCartResponse(cartData);
      setItems(transformedItems);
    } catch (error) {
      console.error("Failed to refresh cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync local cart with backend when user authenticates
  const syncCartOnAuth = async () => {
    setIsLoading(true);
    try {
      // Load local cart first
      const localCart = localStorage.getItem("eventpro_cart");
      const localItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

      // Get backend cart
      const backendCart = await apiService.getCart();
      const backendItems = transformCartResponse(backendCart);

      // Merge: prefer backend items, but add local items that don't exist in backend
      const mergedItems = [...backendItems];
      const backendTicketIds = new Set(backendItems.map(item => item.id));

      for (const localItem of localItems) {
        // Try to add local items to backend cart
        try {
          // Use addToCartSingle if we have eventIdType and ticketType
          // For now, we'll use the batch endpoint
          await apiService.addToCart([{
            ticketTypeId: localItem.ticketTypeId,
            quantity: localItem.quantity,
          }]);
        } catch (error) {
          console.error("Failed to sync local cart item:", error);
        }
      }

      // Refresh cart after sync
      await refreshCart();

      // Clear local cart after successful sync
      localStorage.removeItem("eventpro_cart");
    } catch (error) {
      console.error("Failed to sync cart:", error);
      // If sync fails, just load backend cart
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (newItem: Omit<CartItem, "id">) => {
    if (isAuthenticated) {
      // Use backend API
      try {
        setIsLoading(true);
        // Use addToCartSingle with eventIdType and ticketType if available
        // Otherwise use batch endpoint
        await apiService.addToCart([{
          ticketTypeId: newItem.ticketTypeId,
          quantity: newItem.quantity,
        }]);
        
        // Refresh cart to get updated state
        await refreshCart();
        
        toast({
          title: "Added to cart",
          description: `${newItem.quantity} ticket(s) added to your cart`,
        });
      } catch (error: any) {
        console.error("Failed to add to cart:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to add item to cart",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage
      const updatedItems = [...items];
      const existingIndex = updatedItems.findIndex(
        (item) => item.ticketTypeId === newItem.ticketTypeId
      );

      if (existingIndex >= 0) {
        updatedItems[existingIndex].quantity += newItem.quantity;
      } else {
        updatedItems.push({
          ...newItem,
          id: `temp_${Date.now()}`,
        });
      }

      setItems(updatedItems);
      saveLocalCart(updatedItems);

      toast({
        title: "Added to cart",
        description: `${newItem.quantity} ticket(s) added to your cart`,
      });
    }
  };

  const removeItem = async (itemId: string) => {
    if (isAuthenticated) {
      // Use backend API
      try {
        setIsLoading(true);
        await apiService.removeFromCart(itemId);
        
        // Refresh cart to get updated state
        await refreshCart();
        
        toast({
          title: "Removed from cart",
          description: "Item removed from your cart",
        });
      } catch (error: any) {
        console.error("Failed to remove from cart:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to remove item from cart",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage
      const updatedItems = items.filter((item) => item.id !== itemId);
      setItems(updatedItems);
      saveLocalCart(updatedItems);

      toast({
        title: "Removed from cart",
        description: "Item removed from your cart",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    if (isAuthenticated) {
      // Use backend API
      try {
        setIsLoading(true);
        await apiService.updateCartItem(itemId, quantity);
        
        // Refresh cart to get updated state
        await refreshCart();
      } catch (error: any) {
        console.error("Failed to update cart item:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update cart item",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      setItems(updatedItems);
      saveLocalCart(updatedItems);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      // Use backend API
      try {
        setIsLoading(true);
        await apiService.clearCart();
        
        // Refresh cart to get updated state
        await refreshCart();
        
        toast({
          title: "Cart cleared",
          description: "All items removed from your cart",
        });
      } catch (error: any) {
        console.error("Failed to clear cart:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to clear cart",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Use local storage
      setItems([]);
      localStorage.removeItem("eventpro_cart");

      toast({
        title: "Cart cleared",
        description: "All items removed from your cart",
      });
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
