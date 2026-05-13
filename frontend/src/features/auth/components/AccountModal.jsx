import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { authApi } from '@/services/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toastMsg } from '@/utils/toastMsg'

export function AccountModal({ open, onClose }) {
  const { user, setUser } = useAuthStore()
  const [changePass, setChangePass] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()

  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
      })
      setChangePass(false)
    }
  }, [open, user, reset])

  const mutation = useMutation({
    mutationFn: (data) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.data)
      toast.success('Profil berhasil diperbarui.')
      onClose()
    },
    onError: (e) => toast.error(toastMsg(e)),
  })

  function onSubmit(values) {
    const payload = {
      name: values.name,
      username: values.username,
      email: values.email,
    }
    if (changePass) {
      payload.current_password = values.current_password
      payload.password = values.password
      payload.password_confirmation = values.password_confirmation
    }
    mutation.mutate(payload)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Account Setting"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button loading={mutation.isPending} onClick={handleSubmit(onSubmit)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Input
          label="Nama"
          placeholder="Nama lengkap"
          error={errors.name?.message}
          {...register('name', { required: 'Nama wajib diisi.' })}
        />
        <Input
          label="Username"
          placeholder="username"
          error={errors.username?.message}
          {...register('username', { required: 'Username wajib diisi.' })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="email@contoh.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email wajib diisi.',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email tidak valid.' },
          })}
        />

        <div className="border-t border-[#dde2ee] pt-3">
          <button
            type="button"
            onClick={() => setChangePass((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-navy font-medium hover:underline"
          >
            <KeyRound size={12} />
            {changePass ? 'Batal Ganti Password' : 'Ganti Password'}
          </button>
        </div>

        {changePass && (
          <div className="space-y-3">
            <Input
              label="Password Saat Ini"
              type="password"
              error={errors.current_password?.message}
              {...register('current_password', { required: 'Password saat ini wajib diisi.' })}
            />
            <Input
              label="Password Baru"
              type="password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password baru wajib diisi.',
                minLength: { value: 8, message: 'Minimal 8 karakter.' },
              })}
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              error={errors.password_confirmation?.message}
              {...register('password_confirmation', {
                required: 'Konfirmasi password wajib diisi.',
                // eslint-disable-next-line react-hooks/incompatible-library
                validate: (v) => v === watch('password') || 'Password tidak cocok.',
              })}
            />
          </div>
        )}
      </form>
    </Modal>
  )
}
