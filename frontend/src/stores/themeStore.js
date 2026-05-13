import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      dark: false,
      toggle() {
        const next = !get().dark
        set({ dark: next })
        document.documentElement.classList.toggle('dark', next)
      },
      init() {
        document.documentElement.classList.toggle('dark', get().dark)
      },
    }),
    { name: 'theme-storage' },
  ),
)
