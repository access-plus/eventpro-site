import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice'
import type { ReactNode } from 'react'

/**
 * Props for AdminRoute component.
 */
interface AdminRouteProps {
  /**
   * The component to render if user is an admin.
   */
  children: ReactNode
  /**
   * Optional redirect path when authentication fails.
   * Defaults to '/login'.
   */
  redirectTo?: string
}

/**
 * Admin Route component.
 * 
 * Guards routes that require ADMIN role.
 * 
 * Features:
 * - Checks if user is authenticated
 * - Checks if user has ADMIN role
 * - Redirects to login if not authenticated
 * - Redirects to home if authenticated but not admin
 * - Preserves intended destination in navigation state
 * 
 * @param props - Component props
 * @returns Protected component or redirect
 */
function AdminRoute({ children, redirectTo = '/login' }: AdminRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectUser)

  // Check authentication
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // Check if user has ADMIN role
  const userGroups = user.groups || []
  const isAdmin = userGroups.includes('ADMIN')

  if (!isAdmin) {
    // User is authenticated but not an admin
    return (
      <Navigate
        to="/"
        state={{
          from: location.pathname,
          error: 'You do not have permission to access this page. Admin access required.',
        }}
        replace
      />
    )
  }

  // User is authenticated and is an admin
  return <>{children}</>
}

export default AdminRoute

