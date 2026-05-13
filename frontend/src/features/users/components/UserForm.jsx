import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { rolesApi } from '@/services/api/roles'
import { Input, Select, Toggle } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function UserForm({ user, onSubmit, onClose, loading }) {
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list().then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : []
    }),
  })

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
        placeholder="John Doe"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required.' })}
      />
      <Input
        label="Username"
        placeholder="johndoe"
        error={errors.username?.message}
        {...register('username', { required: 'Username is required.' })}
      />
      <Input
        label="Email"
        type="email"
        placeholder="john@example.com"
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
      <Select
        label="Role"
        error={errors.role_id?.message}
        {...register('role_id')}
      >
        <option value="">— No Role —</option>
        {(Array.isArray(rolesData) ? rolesData : []).map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </Select>
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
