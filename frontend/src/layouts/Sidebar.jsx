import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut, X } from 'lucide-react'
import { menusApi } from '@/services/api/menus'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { SvgIcon } from '@/components/ui/SvgIcon'

function NavIcon({ icon }) {
  return <SvgIcon icon={icon} size={14} className="opacity-70 shrink-0" />
}

function SidebarGroup({ label, children }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-[9px] font-semibold text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors"
      >
        {label}
        <ChevronDown size={10} className={`opacity-45 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

function NavItem({ item, level = 0, onClose }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const hasChildren = item.children?.length > 0
  const isActive = pathname === item.route || pathname.startsWith(item.route + '/')

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-3.5 py-2 text-[12px] border-l-2 transition-all duration-150
            ${isActive ? 'text-white bg-white/12 border-l-gold' : 'text-white/55 border-transparent hover:text-white hover:bg-white/7'}`}
          style={{ paddingLeft: `${14 + level * 12}px` }}
        >
          <span className="flex items-center gap-2">
            <NavIcon icon={item.icon} />
            {item.name}
          </span>
          <ChevronDown size={10} className={`opacity-45 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        </button>
        {open && (
          <div>
            {item.children.map((child) => (
              <NavItem key={child.id} item={child} level={level + 1} onClose={onClose} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.route || '#'}
      onClick={onClose}
      className={`flex items-center gap-2 px-3.5 py-2 text-[12px] border-l-2 transition-all duration-150
        ${isActive ? 'text-white bg-white/12 border-l-gold' : 'text-white/55 border-transparent hover:text-white hover:bg-white/7'}`}
      style={{ paddingLeft: `${14 + level * 12}px` }}
    >
      <NavIcon icon={item.icon} />
      {item.name}
    </Link>
  )
}

export function Sidebar({ onClose }) {
  const { user, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['sidebar'],
    queryFn: () => menusApi.sidebar().then((r) => r.data.data),
    staleTime: 0,
  })

  const menus = data || []

  async function handleLogout() {
    try { await authApi.logout() 

    } catch { 
      // ignore
    }
    queryClient.clear() // Clear Cache
    clearAuth()
  }

  const initials = user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <aside className="w-56 bg-navy flex flex-col shrink-0 h-screen">
      {/* Brand */}
      <div className="px-3.5 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-white tracking-wide">Starter Kit</div>
          <div className="text-[10px] text-white/45 mt-0.5">Admin Panel</div>
          <span className="inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gold text-navy tracking-wide">
            v1.0
          </span>
        </div>
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-white/50 hover:text-white transition-colors p-1"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menus.length > 0 ? (
          <SidebarGroup label="Main">
            {menus.map((item) => (
              <NavItem key={item.id} item={item} onClose={onClose} />
            ))}
          </SidebarGroup>
        ) : (
          <div className="px-3.5 py-4 text-[11px] text-white/30 italic">-.</div>
        )}
      </nav>

      {/* User footer */}
      <div className="mt-auto px-3.5 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-[10px] font-semibold text-navy shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-white/40 truncate">{user?.role?.name || 'No role'}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
