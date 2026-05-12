import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2, Plus, Settings2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { rolesApi } from '@/services/api/roles'
import { menusApi } from '@/services/api/menus'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { RoleForm } from '../components/RoleForm'

const col = createColumnHelper()

function AssignModal({ role, onClose }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('permissions')

  const { data: roleDetail } = useQuery({
    queryKey: ['roles', role.id],
    queryFn: () => rolesApi.get(role.id).then((r) => r.data.data),
    enabled: !!role,
  })

  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.permissions().then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : []
    }),
  })

  const { data: allMenus } = useQuery({
    queryKey: ['menus', 'flat'],
    queryFn: () => menusApi.flat().then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : []
    }),
  })

  const [selectedPerms, setSelectedPerms] = useState(null)
  const [selectedMenus, setSelectedMenus] = useState(null)

  const currentPerms = selectedPerms ?? (roleDetail?.permissions?.map((p) => p.id) || [])
  const currentMenus = selectedMenus ?? (roleDetail?.menus?.map((m) => m.id) || [])

  const syncPermMutation = useMutation({
    mutationFn: () => rolesApi.syncPermissions(role.id, { permission_ids: currentPerms }),
    onSuccess: () => { toast.success('Permissions saved.'); qc.invalidateQueries({ queryKey: ['roles'] }); onClose() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  })

  const syncMenuMutation = useMutation({
    mutationFn: () => rolesApi.syncMenus(role.id, { menu_ids: currentMenus }),
    onSuccess: () => { toast.success('Menus saved.'); qc.invalidateQueries({ queryKey: ['roles', role.id] }); onClose() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  })

  function togglePerm(id) {
    setSelectedPerms((prev) => {
      const list = prev ?? currentPerms
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    })
  }

  function toggleMenu(id) {
    setSelectedMenus((prev) => {
      const list = prev ?? currentMenus
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    })
  }

  return (
    <Modal open onClose={onClose} title={`Assign — ${role.name}`} size="lg" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button
          loading={syncPermMutation.isPending || syncMenuMutation.isPending}
          onClick={() => tab === 'permissions' ? syncPermMutation.mutate() : syncMenuMutation.mutate()}
        >
          Save {tab === 'permissions' ? 'Permissions' : 'Menus'}
        </Button>
      </>
    }>
      {/* Tabs */}
      <div className="flex border-b border-[#dde2ee] mb-4">
        {['permissions', 'menus'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors capitalize
              ${tab === t ? 'text-navy border-gold' : 'text-[#9aa0b8] border-transparent hover:text-[#5a6380]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'permissions' && (
        <div className="grid grid-cols-2 gap-2">
          {(Array.isArray(allPermissions) ? allPermissions : []).map((p) => (
            <label key={p.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#dde2ee] cursor-pointer hover:bg-navy-light/50 transition-colors">
              <input
                type="checkbox"
                className="accent-navy"
                checked={currentPerms.includes(p.id)}
                onChange={() => togglePerm(p.id)}
              />
              <div>
                <div className="text-[12px] font-medium text-[#1a1f2e]">{p.name}</div>
                <div className="text-[10px] text-[#9aa0b8] font-mono">{p.slug}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      {tab === 'menus' && (
        <div className="grid grid-cols-2 gap-2">
          {(Array.isArray(allMenus) ? allMenus : []).map((m) => (
            <label key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#dde2ee] cursor-pointer hover:bg-navy-light/50 transition-colors">
              <input
                type="checkbox"
                className="accent-navy"
                checked={currentMenus.includes(m.id)}
                onChange={() => toggleMenu(m.id)}
              />
              <div className="text-[12px] font-medium text-[#1a1f2e]">{m.name}</div>
            </label>
          ))}
        </div>
      )}
    </Modal>
  )
}

export function RolesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal]       = useState(null)
  const [assigning, setAssigning] = useState(null)
  const [deleting, setDeleting]  = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['roles', { page, search, sortBy, sortDir }],
    queryFn: () => rolesApi.list({ page, search: search || undefined, per_page: 15, sort_by: sortBy, sort_dir: sortDir }).then((r) => r.data),
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
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, v }) => rolesApi.update(id, v),
    onSuccess: () => { toast.success('Role updated.'); qc.invalidateQueries({ queryKey: ['roles'] }); setModal(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => rolesApi.remove(id),
    onSuccess: () => { toast.success('Role deleted.'); qc.invalidateQueries({ queryKey: ['roles'] }); setDeleting(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  })

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
          <Button size="sm" variant="outline" onClick={() => setAssigning(row.original)}>
            <Settings2 size={11} /> Assign
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setModal({ mode: 'edit', role: row.original })}>
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
        title="Roles"
        subtitle="Manage roles, permissions dan menu access"
        actions={
          <Button onClick={() => setModal({ mode: 'create' })}>
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
        <DataTable columns={columns} data={data?.data || []} loading={isLoading} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal.mode === 'edit' ? 'Edit Role' : 'Add Role'}
          size="sm"
        >
          <RoleForm
            role={modal.role}
            loading={createMutation.isPending || updateMutation.isPending}
            onClose={() => setModal(null)}
            onSubmit={(v) => modal.mode === 'edit'
              ? updateMutation.mutate({ id: modal.role.id, v })
              : createMutation.mutate(v)
            }
          />
        </Modal>
      )}

      {/* Assign permissions / menus */}
      {assigning && <AssignModal role={assigning} onClose={() => setAssigning(null)} />}

      {/* Delete confirm */}
      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Delete Role"
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
            Delete role <strong>{deleting.name}</strong>? Users dengan role tersebut tidak bisa akses website ini.
          </p>
        </Modal>
      )}
    </div>
  )
}
