import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { usersApi } from '@/services/api/users'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { UserForm } from '@/features/users/components/UserForm'
import { useDebounce } from '@/hooks/useDebounce'
import { toastMsg } from '@/utils/toastMsg'

const col = createColumnHelper()

export function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', { page, search: debouncedSearch, sortBy, sortDir }],
    queryFn: () => usersApi.list({ page, search: debouncedSearch, per_page: 15, sort_by: sortBy, sort_dir: sortDir }).then((r) => r.data),
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
    mutationFn: async (values) => {
      const res = await usersApi.create({ ...values, is_active: Boolean(values.is_active) })
      return res
    },
    onSuccess: () => { toast.success('User created.'); qc.invalidateQueries({ queryKey: ['users'] }); setModal(null) },
    onError:   (e) => toast.error(toastMsg(e)),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const payload = { ...values, is_active: Boolean(values.is_active) }
      if (!payload.password) delete payload.password
      const res = await usersApi.update(id, payload)
      return res
    },
    onSuccess: () => { toast.success('User updated.'); qc.invalidateQueries({ queryKey: ['users'] }); setModal(null) },
    onError:   (e) => toast.error(toastMsg(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => { toast.success('User deleted.'); qc.invalidateQueries({ queryKey: ['users'] }); setDeleting(null) },
    onError:   (e) => toast.error(toastMsg(e)),
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const columns = useMemo(() => [
    col.accessor('name', {
      header: 'Name',
      meta: { sortable: true },
      cell: (i) => <span className="font-medium text-navy">{i.getValue()}</span>,
    }),
    col.accessor('username', {
      header: 'Username',
      meta: { sortable: true },
      cell: (i) => <span className="font-mono text-[11px] text-[#5a6380]">{i.getValue()}</span>,
    }),
    col.accessor('email', {
      header: 'Email',
      meta: { sortable: true },
      cell: (i) => <span className="text-[#5a6380]">{i.getValue()}</span>,
    }),
    col.accessor('role', {
      header: 'Role',
      cell: (i) => i.getValue() ? <Badge color="navy">{i.getValue().name}</Badge> : <span className="text-[#9aa0b8]">—</span>,
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
          <Button size="sm" variant="ghost" onClick={() => setModal({ mode: 'edit', user: row.original })}>
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
      {isMutating && (
        <div className="fixed inset-0 z-60 cursor-wait" />
      )}

      <PageHeader
        title="Users"
        subtitle="Manage users dan role"
        actions={
          <Button onClick={() => setModal({ mode: 'create' })} disabled={isMutating}>
            <Plus size={12} /> Add User
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="bg-white border border-[#dde2ee] rounded-xl mb-4 shadow-card">
        <div className="flex items-center gap-2 p-3 border-b border-[#dde2ee]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0b8]" />
            <input
              className="pl-7 pr-3 py-1.5 text-[12px] border border-[#dde2ee] rounded-md outline-none focus:border-navy-3 w-52"
              placeholder="Search users..."
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

      {/* Create / Edit Modal*/}
      {modal && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal.mode === 'edit' ? 'Edit User' : 'Add User'}
          size="lg"
        >
          <UserForm
            user={modal.user}
            loading={createMutation.isPending || updateMutation.isPending}
            onClose={() => setModal(null)}
            onSubmit={(values) => {
              if (modal.mode === 'edit') {
                updateMutation.mutate({ id: modal.user.id, values })
              } else {
                createMutation.mutate(values)
              }
            }}
          />
        </Modal>
      )}

      {/* Delete */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete User"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Close</Button>
              <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleting.id)}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-[#5a6380]">
            Apakah Anda yakin ingin hapus <strong>{deleting.name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  )
}
