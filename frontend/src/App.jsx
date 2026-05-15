import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'

import { ProtectedRoute, GuestRoute, PermittedRoute } from '@/routes/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })))
const RolesPage = lazy(() => import('@/features/roles/pages/RolesPage').then(m => ({ default: m.RolesPage })))
const MenusPage = lazy(() => import('@/features/menus/pages/MenusPage').then(m => ({ default: m.MenusPage })))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-navy/20 border-t-navy dark:border-white/20 dark:border-t-white" />
    </div>
  )
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const status = error?.response?.status
      if (status === 401 || status === 403) return
      const msg = error?.response?.data?.message || error?.message || 'Gagal memuat data.'
      toast.error(msg)
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
          <Routes>
            {/* Guest routes */}
            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route element={<PermittedRoute />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                  <Route path="/menus" element={<MenusPage />} />
                </Route>
              </Route>
            </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
          </ErrorBoundary>
        </Suspense>
      </BrowserRouter>

      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  )
}
