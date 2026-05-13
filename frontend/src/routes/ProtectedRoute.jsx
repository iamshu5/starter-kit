import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { menusApi } from '@/services/api/menus'

function HydrationLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f0f2f7]">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-navy" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-[12px] text-[#5a6380]">Loading...</span>
      </div>
    </div>
  )
}

function getAllRoutes(items) {
  return items.flatMap((m) => [m.route, ...getAllRoutes(m.children || [])])
}

export function ProtectedRoute() {
  const token        = useAuthStore((s) => s.token)
  const hasHydrated  = useAuthStore((s) => s._hasHydrated)

  if (!hasHydrated) 
    return <HydrationLoader />

  if (!token) 
    return <Navigate to="/login" replace />

  return <Outlet />
}

export function GuestRoute() {
  const token        = useAuthStore((s) => s.token)
  const hasHydrated  = useAuthStore((s) => s._hasHydrated)

  if (!hasHydrated) return <HydrationLoader />

  if (token) return <Navigate to="/dashboard" replace />

  return <Outlet />
}

// cek path yang diakses ada di sidebar menus berdasarkan role. Jika tidak ada, redirect ke /dashboard.
export function PermittedRoute() {
  const { pathname } = useLocation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sidebar'],
    queryFn: () => menusApi.sidebar().then((r) => r.data.data),
    staleTime: 0,
  })

  if (isLoading) return <HydrationLoader />

  if (isError) return null

  const allowedRoutes = getAllRoutes(data || []).filter(Boolean)

  if (!allowedRoutes.includes(pathname)) {
    toast.error('Anda tidak memiliki izin untuk mengakses halaman tersebut!', { id: 'forbidden-route' })
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
