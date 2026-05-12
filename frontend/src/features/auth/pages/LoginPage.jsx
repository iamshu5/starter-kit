import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(values) {
    try {
      const { data } = await authApi.login(values)
      queryClient.clear()
      setAuth(data.data.user, data.data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="bg-white rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-navy-2 px-6 py-5 border-b border-white/10">
          <h1 className="text-[18px] font-semibold text-white tracking-tight">Starter Kit</h1>
          <p className="text-[11px] text-white/50 mt-1">Sign in</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <Input
            label="Username / Email"
            placeholder="admin / admin@example.com"
            autoComplete="username"
            autoFocus
            error={errors.login?.message}
            {...register('login', { required: 'Username or email is required.' })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Masukan Password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required.' })}
          />

          <Button
            type="submit"
            className="w-full justify-center mt-2"
            loading={isSubmitting}
            size="lg"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
