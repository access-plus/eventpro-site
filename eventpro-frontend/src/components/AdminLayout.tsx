import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";

/**
 * Wraps all admin pages. Ensures only users with ADMIN role can access.
 * Use with ProtectedRoute(allowedRoles={["ADMIN"]}) on the parent route.
 */
export const AdminLayout = () => {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !hasRole("ADMIN")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/admin"
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">Admin</span>
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
