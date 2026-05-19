import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function RoleForm({ role, onSubmit, onClose, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (role) {
      reset({ name: role.name, slug: role.slug, description: role.description || '' })
    } else {
      reset({ name: '', slug: '', description: '' })
    }
  }, [role, reset])

  function autoSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
      <Input
        label="Role Name"
        placeholder="Administrator"
        error={errors.name?.message}
        {...register('name', {
          required: 'Name is required.',
          onChange: (e) => {
            if (!role) setValue('slug', autoSlug(e.target.value))
          },
        })}
      />
      <Input
        label="Slug"
        placeholder="administrator"
        hint="Lowercase, tanpa spasi"
        error={errors.slug?.message}
        {...register('slug', { required: 'Slug is required.' })}
      />
      <div className="md:col-span-2">
        <Input
          label="Description"
          placeholder="Optional description"
          {...register('description')}
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        <Button type="submit" loading={loading}>{role ? 'Update' : 'Create'} Role</Button>
      </div>
    </form>
  )
}
