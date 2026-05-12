import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function RoleForm({ role, onSubmit, onClose, loading }) {
  const {
    register,
    handleSubmit,
    reset,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Role Name"
        placeholder="Administrator"
        error={errors.name?.message}
        {...register('name', {
          required: 'Name is required.',
          onChange: (e) => {
            if (!role) {
              const slugEl = document.querySelector('[name=slug]')
              if (slugEl) slugEl.value = autoSlug(e.target.value)
            }
          },
        })}
      />
      <Input
        label="Slug"
        placeholder="administrator"
        hint="Lowercase, tanpa spasi (Contoh: admin, super-admin, staff)"
        error={errors.slug?.message}
        {...register('slug', { required: 'Slug is required.' })}
      />
      <Input
        label="Description"
        placeholder="Optional description"
        {...register('description')}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        <Button type="submit" loading={loading}>{role ? 'Update' : 'Create'} Role</Button>
      </div>
    </form>
  )
}
