import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCurrentUser, selectIsAuthenticated } from '@/store/slices/authSlice'

/**
 * AuthInitializer component.
 * 
 * Initializes authentication state on app startup by checking for existing
 * authentication tokens and restoring user session if valid.
 * 
 * This component should be rendered once at the app root level.
 */
function AuthInitializer() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  useEffect(() => {
    // Only fetch current user if we have tokens but aren't authenticated yet
    // This handles the case where user refreshes the page
    const tokens = localStorage.getItem('eventpro_access_token')
    
    if (tokens && !isAuthenticated) {
      // We have tokens but no authenticated user, try to restore session
      dispatch(fetchCurrentUser()).catch((error) => {
        // Silently fail if token is invalid - user will need to sign in again
        console.debug('Failed to restore user session:', error)
      })
    }
  }, [dispatch, isAuthenticated])

  // This component doesn't render anything
  return null
}

export default AuthInitializer

