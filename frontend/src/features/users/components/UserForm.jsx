import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { rolesApi } from '@/services/api/roles'
import { Input, Toggle } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Button } from '@/components/ui/Button'

export function UserForm({ user, onSubmit, onClose, loading }) {
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => rolesApi.list().then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : []
    }),
    staleTime: 5 * 60 * 1000,
  })

  const roleOptions = (rolesData || []).map((r) => ({ value: r.id, label: r.name }))

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (user) {
      reset({
        name:      user.name,
        username:  user.username,
        email:     user.email,
        role_id:   user.role?.id ?? '',
        is_active: Boolean(user.is_active),
        password:  '',
      })
    } else {
      reset({ name: '', username: '', email: '', role_id: '', is_active: true, password: '' })
    }
  }, [user, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
      <Input
        label="Full Name"
        placeholder="Masukan Nama Lengkap"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required.' })}
      />
      <Input
        label="Username"
        placeholder="Masukan Username"
        error={errors.username?.message}
        {...register('username', { required: 'Username is required.' })}
      />
      <Input
        label="Email"
        type="email"
        placeholder="Masukan Email"
        error={errors.email?.message}
        {...register('email', { required: 'Email is required.' })}
      />
      <Input
        label={user ? 'New Password' : 'Password'}
        type="password"
        placeholder={user ? 'Kosongkan jika tidak diubah' : 'Min 8 characters'}
        error={errors.password?.message}
        {...register('password', {
          validate: (v) => {
            if (!user && !v) return 'Password is required.'
            if (v && v.length < 8) return 'Min 8 characters.'
            return true
          },
        })}
      />
      <Controller
        name="role_id"
        control={control}
        render={({ field }) => (
          <SearchableSelect
            label="Role"
            error={errors.role_id?.message}
            options={roleOptions}
            value={roleOptions.find((o) => String(o.value) === String(field.value)) || null}
            onChange={(opt) => field.onChange(opt ? opt.value : '')}
            placeholder="— No Role —"
            isClearable
            isLoading={rolesLoading}
          />
        )}
      />
      <Controller
        name="is_active"
        control={control}
        defaultValue={true}
        render={({ field }) => (
          <Toggle
            label="Status"
            checked={Boolean(field.value)}
            onChange={field.onChange}
          />
        )}
      />
      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        <Button type="submit" loading={loading}>{user ? 'Update' : 'Create'} User</Button>
      </div>
    </form>
  )
}
