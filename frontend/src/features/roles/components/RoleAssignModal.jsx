import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { rolesApi } from '@/services/api/roles'
import { menusApi } from '@/services/api/menus'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SvgIcon } from '@/components/ui/SvgIcon'
import { toastMsg } from '@/utils/toastMsg'

export function RoleAssignModal({ role, onClose }) {
  const qc = useQueryClient()

  const { data: roleDetail } = useQuery({
    queryKey: ['roles', role.id],
    queryFn: () => rolesApi.get(role.id).then((r) => r.data.data),
    enabled: !!role,
  })

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.permissions().then((r) => {
      const d = r.data?.data
      return Array.isArray(d) ? d : []
    }),
  })

  const { data: allMenus = [] } = useQuery({
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

  const permsByMenuSlug = useMemo(() => {
    const map = {}
    allPermissions.forEach((p) => {
      const prefix = p.slug.split('.')[0]
      if (!map[prefix]) map[prefix] = []
      map[prefix].push(p)
    })
    return map
  }, [allPermissions])

  const orphanPerms = useMemo(() => {
    const menuSlugs = new Set(allMenus.map((m) => m.slug))
    return allPermissions.filter((p) => !menuSlugs.has(p.slug.split('.')[0]))
  }, [allPermissions, allMenus])

  const savedPermsRef = useRef({})

  function toggleMenu(menu) {
    const isChecked = currentMenus.includes(menu.id)
    const permIds = (permsByMenuSlug[menu.slug] || []).map((p) => p.id)

    if (isChecked) {
      savedPermsRef.current[menu.id] = currentPerms.filter((id) => permIds.includes(id))
      setSelectedMenus((prev) => (prev ?? currentMenus).filter((x) => x !== menu.id))
      setSelectedPerms((prev) => (prev ?? currentPerms).filter((x) => !permIds.includes(x)))
    } else {
      const toRestore = savedPermsRef.current[menu.id] || []
      delete savedPermsRef.current[menu.id]
      setSelectedMenus((prev) => [...(prev ?? currentMenus), menu.id])
      if (toRestore.length > 0) {
        setSelectedPerms((prev) => [...new Set([...(prev ?? currentPerms), ...toRestore])])
      }
    }
  }

  function togglePerm(permId) {
    setSelectedPerms((prev) => {
      const list = prev ?? currentPerms
      return list.includes(permId) ? list.filter((x) => x !== permId) : [...list, permId]
    })
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        rolesApi.syncPermissions(role.id, { permission_ids: currentPerms }),
        rolesApi.syncMenus(role.id, { menu_ids: currentMenus }),
      ]),
    onSuccess: () => {
      toast.success('Saved.')
      qc.invalidateQueries({ queryKey: ['roles'] })
      onClose()
    },
    onError: (e) => toast.error(toastMsg(e)),
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={`Assign — ${role.name}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Save
          </Button>
        </>
      }
    >
      <div className="divide-y divide-[#dde2ee]">
        {/* Column header */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-x-6 pb-2 px-1">
          <span className="text-[11px] font-semibold text-[#9aa0b8] uppercase tracking-wide">Menu</span>
          <span className="hidden sm:block text-[11px] font-semibold text-[#9aa0b8] uppercase tracking-wide">Permissions</span>
        </div>

        {/* One row per menu */}
        {allMenus.map((menu) => {
          const menuChecked = currentMenus.includes(menu.id)
          const perms = permsByMenuSlug[menu.slug] || []

          return (
            <div
              key={menu.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-x-6 gap-y-2 py-3 px-1 items-center"
            >
              {/* Left — menu toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  className="accent-navy w-3.5 h-3.5 cursor-pointer"
                  checked={menuChecked}
                  onChange={() => toggleMenu(menu)}
                />
                <SvgIcon icon={menu.icon} size={14} className="text-[#5a6380] shrink-0" />
                <span className={`text-[12px] font-medium transition-colors ${menuChecked ? 'text-[#1a1f2e]' : 'text-[#9aa0b8]'}`}>
                  {menu.name}
                </span>
              </label>

              {/* Right — permission chips */}
              <div className="flex flex-wrap gap-2">
                {perms.length === 0 ? (
                  <span className="text-[11px] text-[#c4c9db] italic">—</span>
                ) : (
                  perms.map((p) => {
                    const action = p.slug.split('.').slice(1).join('.') || p.name
                    const checked = menuChecked && currentPerms.includes(p.id)

                    return (
                      <label
                        key={p.id}
                        className={[
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors',
                          !menuChecked
                            ? 'border-[#eef0f7] text-[#c4c9db] bg-[#fafbfd] cursor-not-allowed pointer-events-none'
                            : checked
                            ? 'border-navy/30 bg-navy-light/40 text-navy cursor-pointer'
                            : 'border-[#dde2ee] text-[#5a6380] cursor-pointer hover:border-navy/30 hover:text-navy',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          className="accent-navy cursor-pointer disabled:cursor-not-allowed"
                          checked={checked}
                          disabled={!menuChecked}
                          onChange={() => togglePerm(p.id)}
                        />
                        {action}
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}

        {orphanPerms.length > 0 && (
          <div className="py-3 px-1">
            <div className="text-[11px] font-semibold text-[#9aa0b8] uppercase tracking-wide mb-2">
              Other Permissions
            </div>
            <div className="flex flex-wrap gap-2">
              {orphanPerms.map((p) => {
                const checked = currentPerms.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={[
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer',
                      checked
                        ? 'border-navy/30 bg-navy-light/40 text-navy'
                        : 'border-[#dde2ee] text-[#5a6380] hover:border-navy/30 hover:text-navy',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      className="accent-navy cursor-pointer"
                      checked={checked}
                      onChange={() => togglePerm(p.id)}
                    />
                    {p.name}
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
