import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'

const MAX_ATTEMPTS = 10
const LOCKOUT_SECONDS = 30

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const [showPass, setShowPass] = useState(false)

  // protek Brute force
  const [attempts, setAttempts]  = useState(0)
  const [countdown, setCountdown] = useState(0)
  const isLocked = countdown > 0

  useEffect(() => {
    if (!isLocked) return
    const timer = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) { setAttempts(0); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isLocked])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(values) {
    if (isLocked) return
    try {
      const { data } = await authApi.login(values)
      queryClient.clear()
      setAuth(data.data.user, data.data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const next = attempts + 1
      if (next >= MAX_ATTEMPTS) {
        setAttempts(0)
        setCountdown(LOCKOUT_SECONDS)
        toast.error(`Terlalu banyak percobaan. Coba lagi dalam ${LOCKOUT_SECONDS} detik.`)
      } else {
        setAttempts(next)
        toast.error(err.response?.data?.message || 'Login gagal. Silakan coba lagi.')
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 lg:px-16">
        <div className="w-full max-w-100">
          <h1 className="text-[28px] font-bold text-[#1a1f2e] mb-1.5">Sign In</h1>
          <p className="text-[13px] text-[#5a6380] mb-8">Silahkan isi form.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email / Username */}
            <div>
              <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                Email / Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="admin@example.com"
                autoComplete="username"
                autoFocus
                disabled={isSubmitting}
                className={`w-full px-4 py-2.5 text-[13px] rounded-lg border outline-none transition-colors bg-white
                  ${errors.login
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#dde2ee] focus:border-navy'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                {...register('login', { required: 'Email atau username wajib diisi.' })}
              />
              {errors.login && <p className="mt-1 text-[11px] text-red-500">{errors.login.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 pr-10 text-[13px] rounded-lg border outline-none transition-colors bg-white
                    ${errors.password
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#dde2ee] focus:border-navy'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  {...register('password', { required: 'Password wajib diisi.' })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0b8] hover:text-[#5a6380] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full justify-center"
              loading={isSubmitting}
              disabled={isSubmitting || isLocked}
              size="lg"
            >
              {isLocked ? `Tunggu ${countdown}s...` : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[12px] text-[#9aa0b8]">
            Belum punya akun?{' '}
            <Link to="/register" className="text-navy font-medium hover:underline">Daftar sekarang</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-navy items-center justify-center relative overflow-hidden select-none">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-14 right-14 w-52 h-52 rounded-2xl border-2 border-white/10"
            style={{ animation: 'auth-spin-cw 28s linear infinite', willChange: 'transform' }} />
          <div className="absolute top-28 right-28 w-36 h-36 rounded-2xl border-2 border-white/8"
            style={{ animation: 'auth-float-6 6s ease-in-out 0.5s infinite', willChange: 'transform' }} />
          <div className="absolute bottom-20 left-14 w-40 h-40 rounded-2xl border-2 border-white/8"
            style={{ animation: 'auth-spin-ccw 35s linear infinite', willChange: 'transform' }} />
          <div className="absolute bottom-36 left-28 w-28 h-28 rounded-2xl border-2 border-white/10"
            style={{ animation: 'auth-float-n6 8s ease-in-out 1.5s infinite', willChange: 'transform' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/2"
            style={{ animation: 'auth-bg-pulse 7s ease-in-out infinite' }} />
        </div>

        <div className="relative z-10 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center text-navy text-[22px] font-bold mx-auto mb-5 shadow-xl">
            ISK
          </div>
          <div className="text-[30px] font-bold text-white tracking-tight mb-3">Starter Kit by iamshu</div>
          <div className="text-[14px] text-white/50 leading-relaxed max-w-65 mx-auto">
            Admin panel modern berbasis Laravel &amp; React untuk memulai projek dengan cepat.
          </div>
        </div>
      </div>
    </div>
  )
}
