import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { Event } from "@eventpro/shared";

const STORAGE_KEY = "eventpro_recently_viewed";
const MAX_RECENTLY_VIEWED = 10;

type RecentlyViewedContextValue = {
  recentlyViewed: Event[];
  addRecentlyViewed: (event: Event) => void;
  clearRecentlyViewed: () => void;
};

const Context = createContext<RecentlyViewedContextValue | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [recentlyViewed, setRecentlyViewed] = useState<Event[]>([]);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as Event[];
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed);
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, []);

  const addRecentlyViewed = useCallback((event: Event) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((e) => e.id !== event.id);
      const updated = [event, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
  }, []);

  const value: RecentlyViewedContextValue = {
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  }
  return ctx;
}
