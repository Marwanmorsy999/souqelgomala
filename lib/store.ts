import { create } from 'zustand'
import type { CartItem } from './types'

type StoreState = {
  cart: CartItem[]
  isWholesale: boolean
  add: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  setWholesale: (value: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
  cart: [{ id: 'sugar', quantity: 2 }, { id: 'oil', quantity: 1 }, { id: 'rice', quantity: 1 }],
  isWholesale: false,
  add: (id) =>
    set((state) => ({
      cart: state.cart.some((item) => item.id === id)
        ? state.cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...state.cart, { id, quantity: 1 }],
    })),
  increment: (id) =>
    set((state) => ({
      cart: state.cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item),
    })),
  decrement: (id) =>
    set((state) => ({
      cart: state.cart.flatMap((item) =>
        item.id === id && item.quantity === 1 ? [] : item.id === id ? [{ ...item, quantity: item.quantity - 1 }] : [item]
      ),
    })),
  remove: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
  clear: () => set({ cart: [] }),
  setWholesale: (value) => set({ isWholesale: value }),
}))
