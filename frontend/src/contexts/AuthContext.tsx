import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, UserRole, LoginRequest, SignUpRequest, VerifyEmailRequest } from "@/types/api";
import { cognitoService } from "@/lib/cognito";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpRequest) => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpRequest) => {
    try {
      await cognitoService.signUp(data);
      toast({
        title: "Success",
        description: "Account created! Please check your email for verification code.",
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

  const verifyEmail = async (data: VerifyEmailRequest) => {
    try {
      await cognitoService.verifyEmail(data);
      toast({
        title: "Success",
        description: "Email verified! You can now log in.",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
      throw error;
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const tokens = await cognitoService.login(data);
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      // Sync user with backend
      // This is critical - if sync fails, user can't use the app
      try {
        const userData = await apiService.syncUser();
        setUser(userData);

        toast({
          title: "Welcome back!",
          description: `Logged in as ${userData.email}`,
        });
      } catch (syncError: any) {
        // Sync failed - this is a critical error
        console.error("User sync failed after login:", syncError);
        
        // Clear tokens since sync failed
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        // Provide detailed error message
        const errorMessage = syncError.response?.data?.message || 
                             syncError.message || 
                             "Failed to sync user with backend. Please try again or contact support.";
        
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // Cognito login failed
      console.error("Cognito login failed:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please check your email and password.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
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
        verifyEmail,
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
