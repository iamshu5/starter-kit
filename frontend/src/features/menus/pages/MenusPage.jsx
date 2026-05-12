import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { menusApi } from '@/services/api/menus'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SvgIcon } from '@/components/ui/SvgIcon'
import { MenuForm } from '../components/MenuForm'

const col = createColumnHelper()

export function MenusPage() {
  const qc = useQueryClient()
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('order')
  const [sortDir, setSortDir]   = useState('asc')
  const [modal, setModal]       = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['menus', 'list', { page, search, sortBy, sortDir }],
    queryFn: () => menusApi.list({ page, search: search || undefined, per_page: 15, sort_by: sortBy, sort_dir: sortDir }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
    setPage(1)
  }

  const createMutation = useMutation({
    mutationFn: async (v) => {
      const res = await menusApi.create({ ...v, is_active: Boolean(v.is_active), parent_id: v.parent_id || null })
      return res
    },
    onSuccess: () => { toast.success('Menu created.'); qc.invalidateQueries({ queryKey: ['menus'] }); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.message || e.message || 'Failed.'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, v }) => {
      const res = await menusApi.update(id, { ...v, is_active: Boolean(v.is_active), parent_id: v.parent_id || null })
      return res
    },
    onSuccess: () => { toast.success('Menu updated.'); qc.invalidateQueries({ queryKey: ['menus'] }); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.message || e.message || 'Failed.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => menusApi.remove(id),
    onSuccess: () => { toast.success('Menu deleted.'); qc.invalidateQueries({ queryKey: ['menus'] }); setDeleting(null) },
    onError: (e) => toast.error(e.response?.data?.message || e.message || 'Failed.'),
  })

  const columns = useMemo(() => [
    col.accessor('order', {
      header: '#',
      cell: (i) => <span className="font-mono text-[11px] text-[#9aa0b8]">{i.getValue()}</span>,
    }),
    col.accessor('icon', {
      header: 'Icon',
      cell: (i) => <SvgIcon icon={i.getValue()} size={16} className="text-[#5a6380]" />,
    }),
    col.accessor('name', {
      header: 'Name',
      meta: { sortable: true },
      cell: (i) => <span className="font-medium text-navy">{i.getValue()}</span>,
    }),
    col.accessor('slug', {
      header: 'Slug',
      meta: { sortable: true },
      cell: (i) => <span className="font-mono text-[11px] text-[#5a6380]">{i.getValue()}</span>,
    }),
    col.accessor('route', {
      header: 'Route',
      meta: { sortable: true },
      cell: (i) => <span className="font-mono text-[11px] text-[#5a6380]">{i.getValue() || '—'}</span>,
    }),
    col.accessor('parent_id', {
      header: 'Parent',
      cell: (i) => i.getValue()
        ? <Badge color="gray">{i.row.original.parent?.name || `#${i.getValue()}`}</Badge>
        : <span className="text-[#9aa0b8]">Top Level</span>,
    }),
    col.accessor('is_active', {
      header: 'Status',
      cell: (i) => <Badge color={i.getValue() ? 'green' : 'red'}>{i.getValue() ? 'Active' : 'Inactive'}</Badge>,
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setModal({ mode: 'edit', menu: row.original })}>
            <Pencil size={11} /> Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(row.original)}>
            <Trash2 size={11} /> Delete
          </Button>
        </div>
      ),
    }),
  ], [])

  return (
    <div>
      <PageHeader
        title="Menus"
        subtitle="Manage Menu Sidebar"
        actions={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus size={12} /> Add Menu
          </Button>
        }
      />

      <div className="bg-white border border-[#dde2ee] rounded-xl shadow-card">
        <div className="flex items-center gap-2 p-3 border-b border-[#dde2ee]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0b8]" />
            <input
              className="pl-7 pr-3 py-1.5 text-[12px] border border-[#dde2ee] rounded-md outline-none focus:border-navy-3 w-52"
              placeholder="Search menus..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        <DataTable columns={columns} data={data?.data || []} loading={isLoading} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {modal && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal.mode === 'edit' ? 'Edit Menu' : 'Add Menu'}
        >
          <MenuForm
            menu={modal.menu}
            loading={createMutation.isPending || updateMutation.isPending}
            onClose={() => setModal(null)}
            onSubmit={(v) => modal.mode === 'edit'
              ? updateMutation.mutate({ id: modal.menu.id, v })
              : createMutation.mutate(v)
            }
          />
        </Modal>
      )}

      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Menu"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-[#5a6380]">
            Delete menu <strong>{deleting.name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  )
}
