import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserPreferences {
  emailNotifications: {
    orderConfirmation: boolean;
    eventReminders: boolean;
    promotions: boolean;
  };
  display: {
    compactView: boolean;
    showEventImages: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  emailNotifications: {
    orderConfirmation: true,
    eventReminders: true,
    promotions: false,
  },
  display: {
    compactView: false,
    showEventImages: true,
  },
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem("userPreferences");
    return stored ? JSON.parse(stored) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
      emailNotifications: {
        ...prev.emailNotifications,
        ...(updates.emailNotifications || {}),
      },
      display: {
        ...prev.display,
        ...(updates.display || {}),
      },
    }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
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
