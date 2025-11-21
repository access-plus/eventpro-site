import { authService } from './authService'

/**
 * API base URL from environment variables.
 */
const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new Error(
      'API base URL is missing. Please set VITE_API_BASE_URL environment variable.'
    )
  }
  return baseUrl
}

/**
 * Gets the authorization header with the access token.
 * Automatically refreshes tokens if needed.
 */
const getAuthHeaders = async (): Promise<HeadersInit> => {
  try {
    // Ensure tokens are valid and refresh if needed
    const tokens = await authService.ensureValidTokens()
    
    if (!tokens || !tokens.accessToken) {
      throw new Error('No access token available')
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    }
  } catch (error) {
    // If token refresh fails, try to get stored tokens as fallback
    const storedTokens = authService.getStoredTokens()
    if (!storedTokens || !storedTokens.accessToken) {
      throw new Error('No access token available and token refresh failed')
    }
    
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${storedTokens.accessToken}`,
    }
  }
}

/**
 * User profile information from the API.
 */
export interface UserProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phoneNumber: string | null
  accountNonExpired?: boolean
  accountNonLocked?: boolean
  credentialsNonExpired?: boolean
  enabled?: boolean
}

/**
 * Request payload for updating user profile.
 */
export interface UpdateUserProfileRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string | null
}

/**
 * API response wrapper.
 */
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

/**
 * Fetches the current user's profile from the API.
 *
 * @returns Promise that resolves with the user profile
 * @throws Error if the request fails
 */
export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const baseUrl = getApiBaseUrl()
  const headers = await getAuthHeaders()

  const response = await fetch(`${baseUrl}/api/v1/users/me`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || errorData.error || `Failed to fetch user profile: ${response.statusText}`
    )
  }

  const apiResponse: ApiResponse<UserProfile> = await response.json()
  return apiResponse.data
}

/**
 * Updates the current user's profile.
 *
 * @param request Update request with optional fields
 * @returns Promise that resolves with the updated user profile
 * @throws Error if the request fails
 */
export const updateUserProfile = async (
  request: UpdateUserProfileRequest
): Promise<UserProfile> => {
  const baseUrl = getApiBaseUrl()
  const headers = await getAuthHeaders()

  const response = await fetch(`${baseUrl}/api/v1/users/me`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || errorData.error || `Failed to update user profile: ${response.statusText}`
    )
  }

  const apiResponse: ApiResponse<UserProfile> = await response.json()
  return apiResponse.data
}

/**
 * Syncs the current user from Cognito to the application database.
 * This should be called after successful Cognito signup to create the user record.
 *
 * @returns Promise that resolves with the synced user profile
 * @throws Error if the request fails
 */
export const syncUserFromCognito = async (): Promise<UserProfile> => {
  const baseUrl = getApiBaseUrl()
  const headers = await getAuthHeaders()

  const response = await fetch(`${baseUrl}/api/v1/users/sync`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || errorData.error || `Failed to sync user: ${response.statusText}`
    )
  }

  const apiResponse: ApiResponse<UserProfile> = await response.json()
  return apiResponse.data
}

export const userService = {
  getCurrentUserProfile,
  updateUserProfile,
  syncUserFromCognito,
}

