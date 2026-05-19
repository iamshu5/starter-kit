import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2, Plus, Settings2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { rolesApi } from '@/services/api/roles'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FormModal } from '@/components/ui/FormModal'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { RoleForm } from '@/features/roles/components/RoleForm'
import { RoleAssignModal } from '@/features/roles/components/RoleAssignModal'
import { useDebounce } from '@/hooks/useDebounce'
import { toastMsg } from '@/utils/toastMsg'

const col = createColumnHelper()

export function RolesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal]       = useState(null)
  const [assigning, setAssigning] = useState(null)
  const [deleting, setDeleting]  = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['roles', { page, search: debouncedSearch, sortBy, sortDir }],
    queryFn: () => rolesApi.list({ page, search: debouncedSearch || undefined, per_page: 15, sort_by: sortBy, sort_dir: sortDir }).then((r) => r.data),
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
    mutationFn: (v) => rolesApi.create(v),
    onSuccess: () => { toast.success('Role created.'); qc.invalidateQueries({ queryKey: ['roles'] }); setModal(null) },
    onError: (e) => toast.error(toastMsg(e)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, v }) => rolesApi.update(id, v),
    onSuccess: () => { toast.success('Role updated.'); qc.invalidateQueries({ queryKey: ['roles'] }); setModal(null) },
    onError: (e) => toast.error(toastMsg(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => rolesApi.remove(id),
    onSuccess: () => { toast.success('Role deleted.'); qc.invalidateQueries({ queryKey: ['roles'] }); setDeleting(null) },
    onError: (e) => toast.error(toastMsg(e)),
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const columns = useMemo(() => [
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
    col.accessor('description', {
      header: 'Description',
      cell: (i) => <span className="text-[#5a6380]">{i.getValue() || '—'}</span>,
    }),
    col.accessor('users_count', {
      header: 'Users',
      cell: (i) => <Badge color="navy">{i.getValue()}</Badge>,
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="primary" onClick={() => setAssigning(row.original)}>
            <Settings2 size={11} />
          </Button>
          <Button size="sm" variant="gold" onClick={() => setModal({ mode: 'edit', role: row.original })}>
            <Pencil size={11} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(row.original)}>
            <Trash2 size={11} />
          </Button>
        </div>
      ),
    }),
  ], [])

  return (
    <div>
      {isMutating && (
        <div className="fixed inset-0 z-60 cursor-wait" />
      )}

      <PageHeader
        title="Roles"
        subtitle="Manage roles, permissions dan menu access"
        actions={
          <Button onClick={() => setModal({ mode: 'create' })} disabled={isMutating}>
            <Plus size={12} /> Add Role
          </Button>
        }
      />

      <div className="bg-white border border-[#dde2ee] rounded-xl shadow-card">
        <div className="flex items-center gap-2 p-3 border-b border-[#dde2ee]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0b8]" />
            <input
              className="pl-7 pr-3 py-1.5 text-[12px] border border-[#dde2ee] rounded-md outline-none focus:border-navy-3 w-52"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        {isError
          ? <div className="py-10 text-center text-[12px] text-[#e05252]">Gagal memuat data. Silakan muat ulang halaman.</div>
          : <>
              <DataTable
                columns={columns}
                data={data?.data || []}
                loading={isLoading}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={handleSort}
                rowOffset={(page - 1) * 15}
                mutating={isMutating}
              />
              <Pagination meta={data?.meta} onPageChange={setPage} disabled={isMutating} />
            </>}
      </div>

      {/* Create / Edit Modal */}
      <FormModal modal={modal} entityLabel="Role" onClose={() => setModal(null)}>
        <RoleForm
          role={modal?.role}
          loading={createMutation.isPending || updateMutation.isPending}
          onClose={() => setModal(null)}
          onSubmit={(v) => modal?.mode === 'edit'
            ? updateMutation.mutate({ id: modal.role.id, v })
            : createMutation.mutate(v)
          }
        />
      </FormModal>

      {/* Assign permissions / menus */}
      {assigning && <RoleAssignModal role={assigning} onClose={() => setAssigning(null)} />}

      {/* Delete confirm */}
      <ConfirmDeleteModal
        open={!!deleting}
        title="Delete Role"
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      >
        <p className="text-[13px] text-[#5a6380]">
          Delete role <strong>{deleting?.name}</strong>? Users dengan role tersebut tidak bisa akses website ini.
        </p>
      </ConfirmDeleteModal>
    </div>
  )
}
