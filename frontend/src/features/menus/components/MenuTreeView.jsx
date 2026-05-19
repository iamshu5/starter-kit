import { useState, useRef, useEffect, useMemo } from 'react'
import Sortable from 'sortablejs'
import { GripVertical, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { SvgIcon } from '@/components/ui/SvgIcon'
import { Button } from '@/components/ui/Button'

function buildTree(flat) {
  if (!flat?.length) return []
  const map = {}
  flat.forEach((m) => { map[m.id] = { ...m, children: [] } })
  const roots = []
  flat.forEach((m) => {
    if (m.parent_id && map[m.parent_id]) {
      map[m.parent_id].children.push(map[m.id])
    } else {
      roots.push(map[m.id])
    }
  })
  const byOrder = (a, b) => a.order - b.order
  return roots.sort(byOrder).map((r) => ({ ...r, children: r.children.sort(byOrder) }))
}

function SortableContainer({ groupId, onReorder, disabled, children }) {
  const ref = useRef(null)
  const instRef = useRef(null)
  const onReorderRef = useRef(onReorder)
  useEffect(() => { onReorderRef.current = onReorder }, [onReorder])

  useEffect(() => {
    if (!ref.current) return
    instRef.current = Sortable.create(ref.current, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'bg-[#e8eef8]',
      dragClass: 'opacity-50',
      onEnd: () => {
        onReorderRef.current(groupId, instRef.current.toArray())
      },
    })
    return () => { instRef.current?.destroy(); instRef.current = null }
  }, [groupId])

  useEffect(() => {
    instRef.current?.option('disabled', !!disabled)
  }, [disabled])

  return <div ref={ref}>{children}</div>
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-[#dde2ee]">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-3 h-3 bg-[#dde2ee] rounded" />
          <div className="w-4 h-4 bg-[#dde2ee] rounded" />
          <div className={`h-3 bg-[#dde2ee] rounded ${i % 2 === 0 ? 'w-32' : 'w-24'}`} />
        </div>
      ))}
    </div>
  )
}

// ─── Single menu
function MenuRow({ menu, isChild, hasChildren, isCollapsed, onToggle, onEdit, onDelete, disabled }) {
  return (
    <div
      className={[
        'flex items-center gap-2 border-b border-[#dde2ee] group transition-colors',
        isChild ? 'pl-10 pr-4 py-2 bg-[#f7f8fc] hover:bg-[#f0f2fa]' : 'px-4 py-2.5 bg-white hover:bg-[#fafbfd]',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <GripVertical
        size={isChild ? 12 : 13}
        className="drag-handle cursor-grab text-[#dde2ee] group-hover:text-[#9aa0b8] shrink-0 transition-colors"
      />

      {/* toggle parent └ indicator */}
      {isChild ? (
        <span className="text-[#9aa0b8] text-[12px] shrink-0 select-none">└</span>
      ) : hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          className="text-[#9aa0b8] hover:text-navy transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
      ) : (
        <span className="w-3.25 shrink-0" />
      )}

      {/* Icon */}
      <div className="w-5 shrink-0 flex items-center justify-center">
        <SvgIcon
          icon={menu.icon}
          size={isChild ? 14 : 15}
          className={isChild ? 'text-[#9aa0b8]' : 'text-[#5a6380]'}
        />
      </div>

      {/* Name */}
      <span
        className={[
          'flex-1 truncate min-w-0',
          isChild ? 'text-[12px] font-medium text-[#5a6380]' : 'text-[12px] font-semibold text-navy',
        ].join(' ')}
      >
        {menu.name}
      </span>

      {/* Route */}
      {menu.route && (
        <code className="hidden sm:block text-[10px] bg-[#f0f2fa] text-[#5a6380] px-2 py-0.5 rounded font-mono shrink-0">
          {menu.route}
        </code>
      )}

      {/* Dot active/inactive */}
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${menu.is_active ? 'bg-green-400' : 'bg-red-400'}`}
        title={menu.is_active ? 'Active' : 'Inactive'}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="gold" onClick={() => onEdit(menu)}>
          <Pencil size={11} />
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(menu)}>
          <Trash2 size={11} />
        </Button>
      </div>
    </div>
  )
}

// ─── Main tree view ──────────────────────────────────────────────────────────
export function MenuTreeView({ menus, loading, onEdit, onDelete, onReorder, disabled }) {
  const tree = useMemo(() => buildTree(menus), [menus])
  const [collapsed, setCollapsed] = useState({})

  function toggle(id) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) return <SkeletonRows />

  if (!tree.length) {
    return (
      <div className="py-12 text-center text-[12px] text-[#9aa0b8]">
        Tidak Ada Menu.
      </div>
    )
  }

  return (
    <SortableContainer groupId="root" onReorder={onReorder} disabled={disabled}>
      {tree.map((menu) => (
        <div key={menu.id} data-id={String(menu.id)}>
          <MenuRow
            menu={menu}
            isChild={false}
            hasChildren={menu.children.length > 0}
            isCollapsed={!!collapsed[menu.id]}
            onToggle={() => toggle(menu.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />

          {/* Children (collapsible) */}
          {!collapsed[menu.id] && menu.children.length > 0 && (
            <SortableContainer
              groupId={String(menu.id)}
              onReorder={onReorder}
              disabled={disabled}
            >
              {menu.children.map((child) => (
                <div key={child.id} data-id={String(child.id)}>
                  <MenuRow
                    menu={child}
                    isChild
                    hasChildren={false}
                    isCollapsed={false}
                    onToggle={null}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={disabled}
                  />
                </div>
              ))}
            </SortableContainer>
          )}
        </div>
      ))}
    </SortableContainer>
  )
}
