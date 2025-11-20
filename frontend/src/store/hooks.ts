import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, AppStore, RootState } from './index'

/**
 * Typed Redux hooks for use throughout the application
 * 
 * These hooks provide type safety by pre-configuring them with
 * the application's RootState and AppDispatch types.
 * 
 * Usage:
 *   const count = useAppSelector((state) => state.counter.value)
 *   const dispatch = useAppDispatch()
 *   dispatch(increment())
 */

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()

