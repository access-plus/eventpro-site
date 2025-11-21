import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice'
import type { ReactNode } from 'react'

/**
 * Props for ProtectedRoute component.
 */
interface ProtectedRouteProps {
  /**
   * The component to render if user is authenticated.
   */
  children: ReactNode
  /**
   * Optional array of required roles/groups.
   * If provided, user must have at least one of these roles.
   */
  requiredRoles?: string[]
  /**
   * Optional redirect path when authentication fails.
   * Defaults to '/login'.
   */
  redirectTo?: string
}

/**
 * Protected Route component.
 * 
 * Guards routes that require authentication.
 * 
 * Features:
 * - Checks if user is authenticated
 * - Optionally checks for required roles/groups
 * - Redirects to login if not authenticated
 * - Preserves intended destination in navigation state
 * 
 * @param props - Component props
 * @returns Protected component or redirect
 */
function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectUser)

  // Check authentication
  if (!isAuthenticated || !user) {
    // Redirect to login, preserving the intended destination
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0) {
    const userGroups = user.groups || []
    const hasRequiredRole = requiredRoles.some((role) =>
      userGroups.includes(role)
    )

    if (!hasRequiredRole) {
      // User doesn't have required role, redirect to home or show access denied
      return (
        <Navigate
          to="/"
          state={{ 
            from: location.pathname,
            error: 'You do not have permission to access this page',
          }}
          replace
        />
      )
    }
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>
}

export default ProtectedRoute

