import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { User, EventProApi, LoginRequest, SignUpRequest, UserRole } from "@eventpro/shared";

type AuthContextValue = {
  user: User | null;
  api: EventProApi;
  /** True until the initial getCurrentUser() has completed. */
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
  api: EventProApi;
  /** Ref set to a function that clears user (called on 401). */
  onUnauthorizedRef?: React.MutableRefObject<(() => void) | null>;
};

export function AuthProvider({ children, api, onUnauthorizedRef }: AuthProviderProps) {
  if (api == null) {
    throw new Error("AuthProvider requires api");
  }
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  useEffect(() => {
    if (onUnauthorizedRef) onUnauthorizedRef.current = clearUser;
    return () => {
      if (onUnauthorizedRef) onUnauthorizedRef.current = null;
    };
  }, [onUnauthorizedRef, clearUser]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const result = await api.login(data);
      setUserState(result.user);
    },
    [api]
  );

  const signUp = useCallback(
    async (data: SignUpRequest) => {
      await api.signUp(data);
    },
    [api]
  );

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.getCurrentUser();
      setUserState(u);
    } catch {
      setUserState(null);
    }
  }, [api]);

  const logout = useCallback(async () => {
    await api.removeAccessToken();
    setUserState(null);
  }, [api]);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.role === role;
    },
    [user?.role]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) setUserState(u);
      })
      .catch(() => {
        if (!cancelled) setUserState(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const value: AuthContextValue = {
    user,
    api,
    loading,
    isAuthenticated: !!user,
    login,
    signUp,
    logout,
    refreshUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  if (ctx.api == null) throw new Error("useAuth: api is missing from context");
  return ctx;
}
