import { useEffect } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { menusApi } from '@/services/api/menus'
import { Input, Toggle } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Button } from '@/components/ui/Button'
import { SvgIcon } from '@/components/ui/SvgIcon'

export function MenuForm({ menu, onSubmit, onClose, loading }) {
  const { data: flatMenus, isLoading: flatMenusLoading } = useQuery({
    queryKey: ['menus', 'flat'],
    queryFn: () => menusApi.flat().then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : []
    }),
    staleTime: 5 * 60 * 1000,
  })

  const parentOptions = (flatMenus || [])
    .filter((m) => !menu || m.id !== menu.id)
    .map((m) => ({ value: m.id, label: m.name }))

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm()

  const iconPreview = useWatch({ control, name: 'icon', defaultValue: '' })

  useEffect(() => {
    if (menu) {
      reset({
        parent_id: menu.parent_id ?? '',
        name: menu.name,
        slug: menu.slug,
        icon: menu.icon || '',
        route: menu.route || '',
        order: menu.order,
        is_active: Boolean(menu.is_active),
      })
    } else {
      reset({ parent_id: '', name: '', slug: '', icon: '', route: '', order: 0, is_active: true })
    }
  }, [menu, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
      <Input
        label="Menu Name"
        placeholder="Dashboard"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required.' })}
      />
      <Input
        label="Slug"
        placeholder="dashboard"
        error={errors.slug?.message}
        {...register('slug', { required: 'Slug is required.' })}
      />

      {/* Icon — full width */}
      <div className="md:col-span-2 space-y-1">
        <label className="text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide">Icon</label>
        <div className="flex gap-2">
          <textarea
            rows={3}
            className="flex-1 px-3 py-2 text-[11px] font-mono border border-[#dde2ee] rounded-lg outline-none focus:border-navy resize-none"
            placeholder={'<svg xmlns=...\n  <path ... />\n</svg>'}
            {...register('icon')}
          />
          <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-[#dde2ee] rounded-lg bg-[#f7f8fc] text-[#3a4060]">
            {iconPreview.trim()
              ? <SvgIcon icon={iconPreview} size={20} />
              : <span className="text-[9px] text-[#9aa0b8]">Preview</span>
            }
          </div>
        </div>
        <p className="text-[10px] text-[#9aa0b8]">
          Buka <a href="https://heroicons.com" target="_blank" rel="noreferrer" className="underline hover:text-navy">heroicons.com</a>, pilih icon lalu klik "Copy SVG" dan paste di sini.
        </p>
      </div>

      <Input
        label="Route / Path"
        placeholder="/dashboard"
        {...register('route')}
      />
      <Controller
        name="parent_id"
        control={control}
        render={({ field }) => (
          <SearchableSelect
            label="Parent Menu"
            options={parentOptions}
            value={parentOptions.find((o) => String(o.value) === String(field.value)) || null}
            onChange={(opt) => field.onChange(opt ? opt.value : '')}
            placeholder="— Top Level —"
            isClearable
            isLoading={flatMenusLoading}
          />
        )}
      />
      <Input
        label="Order"
        type="number"
        min={0}
        {...register('order', { valueAsNumber: true })}
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
        <Button type="submit" loading={loading}>{menu ? 'Update' : 'Create'} Menu</Button>
      </div>
    </form>
  )
}
