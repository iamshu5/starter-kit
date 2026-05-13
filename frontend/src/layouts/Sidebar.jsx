import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronLeft, LogOut, Settings, X } from 'lucide-react'
import { menusApi } from '@/services/api/menus'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { SvgIcon } from '@/components/ui/SvgIcon'

function NavIcon({ icon }) {
  return <SvgIcon icon={icon} size={14} className="opacity-70 shrink-0" />
}

function NavItem({ item, level = 0, onClose, collapsed }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const hasChildren = item.children?.length > 0
  const isActive = pathname === item.route || (item.route && pathname.startsWith(item.route + '/'))

  if (collapsed && level === 0) {
    return (
      <div className="relative group">
        {hasChildren ? (
          <div className={`flex justify-center items-center py-2.5 border-l-2 cursor-default
            ${isActive ? 'text-white bg-white/12 border-l-gold' : 'text-white/55 border-transparent'}`}
          >
            <NavIcon icon={item.icon} />
          </div>
        ) : (
          <Link
            to={item.route || '#'}
            onClick={onClose}
            className={`flex justify-center items-center py-2.5 border-l-2 transition-all duration-150
              ${isActive ? 'text-white bg-white/12 border-l-gold' : 'text-white/55 border-transparent hover:text-white hover:bg-white/7'}`}
          >
            <NavIcon icon={item.icon} />
          </Link>
        )}
        {/* Tooltip */}
        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-navy-2 text-white text-[11px] whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.name}
        </span>
      </div>
    )
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between py-2 text-[12px] border-l-2 transition-all duration-150
            ${isActive ? 'text-white bg-white/12 border-l-gold' : 'text-white/55 border-transparent hover:text-white hover:bg-white/7'}`}
          style={{ paddingLeft: `${14 + level * 12}px`, paddingRight: '14px' }}
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
              <NavItem key={child.id} item={child} level={level + 1} onClose={onClose} collapsed={false} />
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
      className={`flex items-center gap-2 py-2 text-[12px] border-l-2 transition-all duration-150
        ${isActive ? 'text-white bg-white/12 border-l-gold' : 'text-white/55 border-transparent hover:text-white hover:bg-white/7'}`}
      style={{ paddingLeft: `${14 + level * 12}px`, paddingRight: '14px' }}
    >
      <NavIcon icon={item.icon} />
      {item.name}
    </Link>
  )
}

function UserMenu({ user, collapsed, onSettings, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initials = user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U'

  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-[#dde2ee] dark:border-slate-700 py-1 z-50 min-w-42.5">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-[#dde2ee] dark:border-slate-700">
            <div className="text-[12px] font-semibold text-[#1a1f2e] dark:text-slate-100 truncate">{user?.name}</div>
            <div className="text-[10px] text-[#9aa0b8] dark:text-slate-400 truncate">{user?.email || user?.username}</div>
            <span className="inline-block mt-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-navy-light text-navy dark:bg-slate-700 dark:text-blue-300">
              {user?.role?.name || 'No role'}
            </span>
          </div>
          {/* Modal Account Settings */}
          <button
            onClick={() => { setOpen(false); onSettings() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#1a1f2e] dark:text-slate-200 hover:bg-[#f7f8fc] dark:hover:bg-slate-700 transition-colors"
          >
            <Settings size={13} className="text-[#9aa0b8]" />
            Account Setting
          </button>
          <div className="border-t border-[#dde2ee] dark:border-slate-700 my-0.5" />
          {/* Logout */}
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      )}

      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors ${open ? 'bg-white/10' : ''}`}
        title={collapsed ? user?.name : undefined}
      >
        <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-[10px] font-semibold text-navy shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[11px] font-medium text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-white/40 truncate">{user?.role?.name || 'No role'}</div>
            </div>
            <ChevronDown size={11} className={`text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
    </div>
  )
}

export function Sidebar({ onClose, collapsed, onToggleCollapse, onOpenSettings }) {
  const { user, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const [hovered, setHovered] = useState(false)
  const effectiveCollapsed = collapsed && !hovered

  const { data } = useQuery({
    queryKey: ['sidebar'],
    queryFn: () => menusApi.sidebar().then((r) => r.data.data),
    staleTime: 0,
  })

  const menus = data || []

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    queryClient.clear()
    clearAuth()
  }

  return (
    <aside
      className={`${effectiveCollapsed ? 'w-13' : 'w-56'} bg-navy flex flex-col shrink-0 h-screen transition-[width] duration-200 overflow-hidden`}
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
        {/* Brand */}
        <div className="px-3 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0">
          {effectiveCollapsed
            ? <div className="w-full flex justify-center"><div className="w-6 h-6 rounded bg-gold flex items-center justify-center text-[9px] font-bold text-navy">SK</div></div>
            : <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white tracking-wide">Starter Kit</div>
                <div className="text-[10px] text-white/45 mt-0.5">Admin Panel</div>
              </div>
          }
          <div className="flex items-center shrink-0">
            {/* Desktop toggle */}
            {onToggleCollapse && (
              <button
                onClick={() => { setHovered(false); onToggleCollapse() }}
                className="hidden lg:flex text-white/40 hover:text-white transition-colors p-1 rounded"
                title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              >
                <ChevronLeft size={14} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
              </button>
            )}
            {/* Mobile close */}
            {onClose && (
              <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white transition-colors p-1" aria-label="Tutup menu">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {menus.length > 0
            ? menus.map((item) => <NavItem key={item.id} item={item} onClose={onClose} collapsed={effectiveCollapsed} />)
            : <div className="px-3.5 py-4 text-[11px] text-white/30 italic">-.</div>
          }
        </nav>

        {/* User footer */}
        <div className={`mt-auto border-t border-white/10 ${effectiveCollapsed ? 'px-1.5 py-2' : 'px-2 py-2'}`}>
          <UserMenu
            user={user}
            collapsed={effectiveCollapsed}
            onSettings={onOpenSettings}
            onLogout={handleLogout}
          />
        </div>
      </aside>
  )
}
