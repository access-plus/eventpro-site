import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import { authService, type CurrentUser, type SignInParams, type SignUpParams } from '../../services/authService'

/**
 * Authentication slice for managing user authentication state.
 * 
 * This slice handles:
 * - User authentication state
 * - Token management
 * - Loading states
 * - Authentication status
 * - Error handling
 * 
 * Actions and async thunks will be implemented in subsequent tasks (T3-033 through T3-035).
 */

/**
 * Authentication state interface.
 * 
 * Defines the shape of the authentication state in the Redux store:
 * - `user`: Current authenticated user information (null if not authenticated)
 * - `token`: Current authentication token (access token) (null if not authenticated)
 * - `isAuthenticated`: Boolean flag indicating if user is authenticated
 * - `isLoading`: Boolean flag indicating if an authentication operation is in progress
 * - `error`: Error message if an authentication operation failed (null if no error)
 */
export interface AuthState {
  user: CurrentUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Loads initial authentication state from localStorage.
 * 
 * Attempts to restore user session from stored tokens.
 * 
 * @returns Initial auth state, potentially with restored user/token
 */
const loadInitialState = (): AuthState => {
  try {
    const tokens = authService.getStoredTokens()
    if (tokens) {
      // Tokens exist, but we need to verify they're still valid
      // Return state with token, but user will be loaded via fetchCurrentUser
      return {
        user: null, // Will be loaded by fetchCurrentUser if tokens are valid
        token: tokens.accessToken,
        isAuthenticated: false, // Will be set to true after fetchCurrentUser succeeds
        isLoading: false,
        error: null,
      }
    }
  } catch (error) {
    console.error('Failed to load initial state from localStorage:', error)
  }

  // Default unauthenticated state
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }
}

/**
 * Initial authentication state.
 * 
 * Attempts to load from localStorage, falls back to default unauthenticated state.
 */
const initialState: AuthState = loadInitialState()

/**
 * Async thunk for signing in a user.
 * 
 * Calls authService.signIn and updates the auth state with user and token.
 */
export const signInAsync = createAsyncThunk(
  'auth/signIn',
  async (params: SignInParams, { rejectWithValue }) => {
    try {
      const tokens = await authService.signIn(params)
      const user = await authService.getCurrentUser()
      
      if (!user) {
        return rejectWithValue('Failed to get user information after sign in')
      }

      return {
        user,
        token: tokens.accessToken,
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sign in failed')
    }
  }
)

/**
 * Async thunk for signing up a new user.
 * 
 * Calls authService.signUp to register a new user.
 * Note: After signup, user needs to verify email before they can sign in.
 */
export const signUpAsync = createAsyncThunk(
  'auth/signUp',
  async (params: SignUpParams, { rejectWithValue }) => {
    try {
      await authService.signUp(params)
      // Signup successful - user will need to verify email before signing in
      return null
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sign up failed')
    }
  }
)

/**
 * Async thunk for signing out the current user.
 * 
 * Calls authService.signOut to clear authentication.
 */
export const signOutAsync = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await authService.signOut()
      return null
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Sign out failed')
    }
  }
)

/**
 * Async thunk for fetching the current authenticated user.
 * 
 * Calls authService.getCurrentUser to retrieve user information.
 */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser()
      
      if (!user) {
        return rejectWithValue('No authenticated user found')
      }

      // Get tokens from storage
      const tokens = authService.getStoredTokens()
      if (!tokens) {
        return rejectWithValue('No tokens found')
      }

      return {
        user,
        token: tokens.accessToken,
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch current user')
    }
  }
)

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Sets the authenticated user and token after successful sign in.
     * 
     * @param state - Current auth state
     * @param action - Payload containing user and token
     */
    signIn: (state, action: PayloadAction<{ user: CurrentUser; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.isLoading = false
      state.error = null
      // Persist token to localStorage
      const tokens = authService.getStoredTokens()
      if (tokens) {
        authService.storeTokens({
          accessToken: action.payload.token,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
        })
      }
    },
    /**
     * Clears authentication state after sign out.
     */
    signOut: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
      // Clear tokens from localStorage
      authService.clearStoredTokens()
    },
    /**
     * Updates the current user information.
     * 
     * @param state - Current auth state
     * @param action - Payload containing updated user information
     */
    setUser: (state, action: PayloadAction<CurrentUser | null>) => {
      state.user = action.payload
      // Update isAuthenticated based on whether user is set
      state.isAuthenticated = action.payload !== null
    },
    /**
     * Sets the loading state for authentication operations.
     * 
     * @param state - Current auth state
     * @param action - Payload containing loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
      // Clear error when starting a new operation
      if (action.payload) {
        state.error = null
      }
    },
    /**
     * Sets an error message in the auth state.
     * 
     * @param state - Current auth state
     * @param action - Payload containing error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
    /**
     * Clears the error message from the auth state.
     */
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // signInAsync
    builder
      .addCase(signInAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signInAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        // Tokens are already stored by authService.signIn, but ensure sync
        const tokens = authService.getStoredTokens()
        if (tokens && tokens.accessToken !== action.payload.token) {
          // Update token in storage if it differs
          authService.storeTokens({
            accessToken: action.payload.token,
            idToken: tokens.idToken,
            refreshToken: tokens.refreshToken,
          })
        }
      })
      .addCase(signInAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // signUpAsync
    builder
      .addCase(signUpAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signUpAsync.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
        // Note: User is not authenticated after signup until email is verified
      })
      .addCase(signUpAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // signOutAsync
    builder
      .addCase(signOutAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signOutAsync.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
        // Tokens are already cleared by authService.signOut, but ensure sync
        authService.clearStoredTokens()
      })
      .addCase(signOutAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        // Still clear auth state even if signout fails
        state.user = null
        state.token = null
        state.isAuthenticated = false
        // Clear tokens from storage even if signout fails
        authService.clearStoredTokens()
      })

    // fetchCurrentUser
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        // Ensure tokens are persisted (they should already be from authService)
        const tokens = authService.getStoredTokens()
        if (!tokens || tokens.accessToken !== action.payload.token) {
          // Update token in storage if it differs or is missing
          const currentTokens = tokens || { idToken: '', refreshToken: '' }
          authService.storeTokens({
            accessToken: action.payload.token,
            idToken: currentTokens.idToken,
            refreshToken: currentTokens.refreshToken,
          })
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { signIn, signOut, setUser, setLoading, setError, clearError } = authSlice.actions

// Selectors
/**
 * Selects the current authenticated user from the auth state.
 */
export const selectUser = (state: RootState) => state.auth.user

/**
 * Selects the current authentication token from the auth state.
 */
export const selectToken = (state: RootState) => state.auth.token

/**
 * Selects the authentication status from the auth state.
 */
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated

/**
 * Selects the loading status from the auth state.
 */
export const selectIsLoading = (state: RootState) => state.auth.isLoading

/**
 * Selects the error message from the auth state.
 */
export const selectError = (state: RootState) => state.auth.error

export default authSlice.reducer

