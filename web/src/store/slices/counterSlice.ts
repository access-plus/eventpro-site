import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

/**
 * Counter slice for demonstration and testing Redux store
 * 
 * This slice demonstrates:
 * - Basic state management
 * - Action creators
 * - Type-safe reducers
 */

interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
    reset: (state) => {
      state.value = 0
    },
  },
})

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions

// Selector for getting the counter value
export const selectCount = (state: RootState) => state.counter.value

export default counterSlice.reducer

