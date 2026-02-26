import React, { createContext, useContext, useState, useEffect } from "react";
import type { Event } from "@/types/api";

interface PreferencesContextType {
  recentlyViewed: Event[];
  addRecentlyViewed: (event: Event) => void;
  clearRecentlyViewed: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const MAX_RECENTLY_VIEWED = 10;

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Event[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eventpro_recently_viewed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as (Event & { startDateTime?: string; endDateTime?: string })[];
        const normalized: Event[] = parsed.map((e) => ({
          ...e,
          startTime: e.startTime ?? e.startDateTime ?? "",
          endTime: e.endTime ?? e.endDateTime ?? "",
        }));
        setRecentlyViewed(normalized);
      } catch (error) {
        console.error("Failed to parse recently viewed:", error);
      }
    }
  }, []);

  const addRecentlyViewed = (event: Event) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((e) => e.id !== event.id);
      const updated = [event, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      localStorage.setItem("eventpro_recently_viewed", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem("eventpro_recently_viewed");
  };

  return (
    <PreferencesContext.Provider
      value={{
        recentlyViewed,
        addRecentlyViewed,
        clearRecentlyViewed,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
};
