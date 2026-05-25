import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, UserRole, LoginRequest, SignUpRequest } from "@/types/api";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { appStorage } from "@/state/storage";
import { queryKeys } from "@/state/queryKeys";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = appStorage.getAccessToken();
      if (token) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        queryClient.setQueryData(queryKeys.auth.currentUser, userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      appStorage.clearUserScopedState();
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpRequest) => {
    try {
      await apiService.signUp(data);
      toast({
        title: "Success",
        description: "Account created! You can now log in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
      throw error;
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const result = await apiService.login(data);
      appStorage.setAccessToken(result.accessToken);
      setUser(result.user);
      queryClient.setQueryData(queryKeys.auth.currentUser, result.user);
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });

      toast({
        title: "Welcome back!",
        description: `Logged in as ${result.user.email}`,
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      const isNetworkError =
        error?.code === "ERR_NETWORK" ||
        error?.code === "ECONNRESET" ||
        error?.message === "Network Error" ||
        (error?.isAxiosError && !error?.response);
      const description = isNetworkError
        ? "Cannot reach the server. Check that the backend is running (e.g. http://localhost:8080) and try again."
        : error?.response?.data?.message || error?.message || "Invalid credentials. Please check your email and password.";
      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    appStorage.clearUserScopedState();
    setUser(null);
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      queryClient.setQueryData(queryKeys.auth.currentUser, userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        login,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
