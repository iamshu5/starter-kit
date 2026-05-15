import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setAuth:        (user, token) => set({ user, token }),
      setUser:        (user) => set({ user }),
      setToken:       (token) => set({ token }),
      clearAuth:      () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
