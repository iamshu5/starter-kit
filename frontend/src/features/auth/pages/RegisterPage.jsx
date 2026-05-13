import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { authApi } from '@/services/api/auth'
import { Button } from '@/components/ui/Button'
import { toastMsg } from '@/utils/toastMsg'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(values) {
    try {
      await authApi.register(values)
      setDone(true)
    } catch (err) {
      toast.error(toastMsg(err))
    }
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch('password', '')

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 lg:px-16">
        <div className="w-full max-w-100">

          {done ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-[22px] font-bold text-[#1a1f2e] mb-2">Registrasi Berhasil!</h2>
              <p className="text-[13px] text-[#5a6380] mb-6 leading-relaxed">
                Akun Anda telah dibuat dan sedang menunggu aktivasi oleh admin.<br />
                Anda belum bisa login sampai akun diaktifkan.
              </p>
              <Button className="w-full justify-center" onClick={() => navigate('/login', { replace: true })}>
                Kembali ke Login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-[28px] font-bold text-[#1a1f2e] mb-1.5">Buat Akun</h1>
              <p className="text-[13px] text-[#5a6380] mb-8">
                Isi form register.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nama */}
                <div>
                  <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    autoFocus
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2.5 text-[13px] rounded-lg border outline-none transition-colors bg-white
                      ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#dde2ee] focus:border-navy'}
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                    {...register('name', { required: 'Nama lengkap wajib diisi.' })}
                  />
                  {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name.message}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="johndoe"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2.5 text-[13px] rounded-lg border outline-none transition-colors bg-white
                      ${errors.username ? 'border-red-400 focus:border-red-500' : 'border-[#dde2ee] focus:border-navy'}
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                    {...register('username', {
                      required: 'Username wajib diisi.',
                      pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Username hanya boleh huruf, angka, _ dan -.' },
                    })}
                  />
                  {errors.username && <p className="mt-1 text-[11px] text-red-500">{errors.username.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2.5 text-[13px] rounded-lg border outline-none transition-colors bg-white
                      ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#dde2ee] focus:border-navy'}
                      disabled:opacity-60 disabled:cursor-not-allowed`}
                    {...register('email', {
                      required: 'Email wajib diisi.',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email tidak valid.' },
                    })}
                  />
                  {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 karakter"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-2.5 pr-10 text-[13px] rounded-lg border outline-none transition-colors bg-white
                        ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#dde2ee] focus:border-navy'}
                        disabled:opacity-60 disabled:cursor-not-allowed`}
                      {...register('password', {
                        required: 'Password wajib diisi.',
                        minLength: { value: 8, message: 'Password minimal 8 karakter.' },
                      })}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0b8] hover:text-[#5a6380] transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="block text-[12px] font-medium text-[#3a4060] mb-1.5">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-2.5 pr-10 text-[13px] rounded-lg border outline-none transition-colors bg-white
                        ${errors.password_confirmation ? 'border-red-400 focus:border-red-500' : 'border-[#dde2ee] focus:border-navy'}
                        disabled:opacity-60 disabled:cursor-not-allowed`}
                      {...register('password_confirmation', {
                        required: 'Konfirmasi password wajib diisi.',
                        validate: (v) => v === password || 'Konfirmasi password tidak cocok.',
                      })}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0b8] hover:text-[#5a6380] transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password_confirmation && <p className="mt-1 text-[11px] text-red-500">{errors.password_confirmation.message}</p>}
                </div>

                <Button type="submit" className="w-full justify-center mt-1" loading={isSubmitting} disabled={isSubmitting} size="lg">
                  Daftar
                </Button>
              </form>

              <p className="mt-6 text-center text-[12px] text-[#9aa0b8]">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-navy font-medium hover:underline">Sign In</Link>
              </p>
            </>
          )}
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
