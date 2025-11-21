import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice'
import type { ReactNode } from 'react'

/**
 * Props for OrganizerRoute component.
 */
interface OrganizerRouteProps {
  /**
   * The component to render if user is an organizer or admin.
   */
  children: ReactNode
  /**
   * Optional redirect path when authentication fails.
   * Defaults to '/login'.
   */
  redirectTo?: string
}

/**
 * Organizer Route component.
 * 
 * Guards routes that require ORGANIZER or ADMIN role.
 * Admins have access to organizer routes.
 * 
 * Features:
 * - Checks if user is authenticated
 * - Checks if user has ORGANIZER or ADMIN role
 * - Redirects to login if not authenticated
 * - Redirects to home if authenticated but not organizer/admin
 * - Preserves intended destination in navigation state
 * 
 * @param props - Component props
 * @returns Protected component or redirect
 */
function OrganizerRoute({
  children,
  redirectTo = '/login',
}: OrganizerRouteProps) {
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

  // Check if user has ORGANIZER or ADMIN role
  const userGroups = user.groups || []
  const isOrganizer = userGroups.includes('ORGANIZER')
  const isAdmin = userGroups.includes('ADMIN')

  if (!isOrganizer && !isAdmin) {
    // User is authenticated but not an organizer or admin
    return (
      <Navigate
        to="/"
        state={{
          from: location.pathname,
          error: 'You do not have permission to access this page. Organizer access required.',
        }}
        replace
      />
    )
  }

  // User is authenticated and is an organizer or admin
  return <>{children}</>
}

export default OrganizerRoute

