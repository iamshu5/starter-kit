import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun } from 'lucide-react'
import { Sidebar } from '@/layouts/Sidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AccountModal } from '@/features/auth/components/AccountModal'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'

const titles = {
  '/dashboard': 'Dashboard',
  '/users': 'User Management',
  '/roles': 'Role Management',
  '/menus': 'Menu Management',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const title = titles[pathname] || 'Page'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { collapsed, toggle: toggleCollapse } = useSidebarStore()
  const { dark, toggle: toggleDark } = useThemeStore()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenSettings={() => setAccountOpen(true)}
        />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-13 bg-navy flex items-center px-4 gap-3 shrink-0 border-b border-navy-3 sticky top-0 z-20">
          {/* Hamburger — mobile */}
          <button
            className="lg:hidden text-white/70 hover:text-white transition-colors p-1"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-white">{title}</div>
          </div>
          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title={dark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f0f2f7] dark:bg-slate-900">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
