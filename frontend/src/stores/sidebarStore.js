import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSidebarStore = create(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: 'sidebar-storage' },
  ),
)
