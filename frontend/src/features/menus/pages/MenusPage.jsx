import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { menusApi } from '@/services/api/menus'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { FormModal } from '@/components/ui/FormModal'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { MenuForm } from '@/features/menus/components/MenuForm'
import { MenuTreeView } from '@/features/menus/components/MenuTreeView'
import { toastMsg } from '@/utils/toastMsg'

export function MenusPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data: flatMenus = [], isLoading, isError } = useQuery({
    queryKey: ['menus', 'flat'],
    queryFn: () => menusApi.flat().then((r) => Array.isArray(r.data?.data) ? r.data.data : []),
    staleTime: 5 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flatMenus
    const matchIds = new Set()
    flatMenus.forEach((m) => {
      if (m.name.toLowerCase().includes(q) || (m.route || '').toLowerCase().includes(q)) {
        matchIds.add(m.id)
        if (m.parent_id) matchIds.add(m.parent_id)
      }
    })
    return flatMenus.filter((m) => matchIds.has(m.id))
  }, [flatMenus, search])

  const createMutation = useMutation({
    mutationFn: (v) => menusApi.create({ ...v, is_active: Boolean(v.is_active), parent_id: v.parent_id || null }),
    onSuccess: () => { toast.success('Menu created.'); qc.invalidateQueries({ queryKey: ['menus'] }); setModal(null) },
    onError: (e) => toast.error(toastMsg(e)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, v }) => menusApi.update(id, { ...v, is_active: Boolean(v.is_active), parent_id: v.parent_id || null }),
    onSuccess: () => { toast.success('Menu updated.'); qc.invalidateQueries({ queryKey: ['menus'] }); setModal(null) },
    onError: (e) => toast.error(toastMsg(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => menusApi.remove(id),
    onSuccess: () => { toast.success('Menu deleted.'); qc.invalidateQueries({ queryKey: ['menus'] }); setDeleting(null) },
    onError: (e) => toast.error(toastMsg(e)),
  })

  async function handleReorder(groupId, newIdOrder) {
    const parentId = groupId === 'root' ? null : Number(groupId)
    try {
      await Promise.all(
        newIdOrder.map((strId, idx) => {
          const id = Number(strId)
          const full = flatMenus.find((m) => m.id === id)
          return menusApi.update(id, { ...full, order: idx + 1, parent_id: parentId })
        })
      )
      qc.invalidateQueries({ queryKey: ['menus'] })
    } catch (e) {
      toast.error(toastMsg(e))
      qc.invalidateQueries({ queryKey: ['menus'] })
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <div>
      {isMutating && <div className="fixed inset-0 z-60 cursor-wait" />}

      <PageHeader
        title="Menus"
        subtitle="Manage Menu Sidebar"
        actions={
          <Button onClick={() => setModal({ mode: 'create' })} disabled={isMutating}>
            <Plus size={12} /> Add Menu
          </Button>
        }
      />

      <div className="bg-white border border-[#dde2ee] rounded-xl shadow-card">
        <div className="flex items-center gap-2 p-3 border-b border-[#dde2ee]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0b8]" />
            <input
              className="pl-7 pr-3 py-1.5 text-[12px] border border-[#dde2ee] rounded-md outline-none focus:border-navy w-52"
              placeholder="Search menus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isError
          ? <div className="py-10 text-center text-[12px] text-[#e05252]">Gagal memuat data. Silakan muat ulang halaman.</div>
          : (
            <MenuTreeView
              menus={filtered}
              loading={isLoading}
              onEdit={(menu) => setModal({ mode: 'edit', menu })}
              onDelete={setDeleting}
              onReorder={handleReorder}
              disabled={isMutating || !!search.trim()}
            />
          )
        }
      </div>

      <FormModal modal={modal} entityLabel="Menu" onClose={() => setModal(null)}>
        <MenuForm
          menu={modal?.menu}
          loading={createMutation.isPending || updateMutation.isPending}
          onClose={() => setModal(null)}
          onSubmit={(v) => modal?.mode === 'edit'
            ? updateMutation.mutate({ id: modal.menu.id, v })
            : createMutation.mutate(v)
          }
        />
      </FormModal>

      <ConfirmDeleteModal
        open={!!deleting}
        title="Delete Menu"
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      >
        <p className="text-[13px] text-[#5a6380]">
          Delete menu <strong>{deleting?.name}</strong>?
        </p>
      </ConfirmDeleteModal>
    </div>
  )
}
