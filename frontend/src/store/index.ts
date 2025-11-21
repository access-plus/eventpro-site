import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/counterSlice'
import authReducer from './slices/authSlice'

/**
 * Redux store configuration using Redux Toolkit
 * 
 * This store is configured with:
 * - Redux Thunk middleware (included by default)
 * - Redux DevTools Extension (enabled in development with enhanced configuration)
 * - Type-safe state and dispatch types
 */
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
  },
  // Redux DevTools configuration
  // Enabled in development, disabled in production for security
  devTools: import.meta.env.DEV
    ? {
        // Enable DevTools in development
        name: 'EventPro Store',
        // Optionally configure DevTools options
        trace: true, // Enable action stack traces
        traceLimit: 25, // Limit stack trace depth
      }
    : false,
})

// Infer the `RootState` and `AppDispatch` types from the store itself
// This ensures type safety when accessing state and dispatching actions
export type RootState = ReturnType<typeof store.getState>

// Inferred type: Dispatch & ThunkDispatch<RootState, undefined, UnknownAction>
export type AppDispatch = typeof store.dispatch

// Store type for useStore hook
export type AppStore = typeof store

