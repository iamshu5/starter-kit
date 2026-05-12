import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export function DataTable({ columns, data, loading = false, emptyText = 'No data found.', sortBy, sortDir, onSort }) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const sortable = onSort && header.column.columnDef.meta?.sortable
                const isActive = sortable && sortBy === header.column.id
                return (
                  <th
                    key={header.id}
                    onClick={sortable ? () => onSort(header.column.id) : undefined}
                    className={`px-3 py-2.5 text-left text-[10px] font-semibold text-[#9aa0b8] uppercase tracking-wide border-b border-[#dde2ee] bg-[#f7f8fc] whitespace-nowrap${sortable ? ' cursor-pointer select-none hover:text-[#5a6380]' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable && (
                        isActive
                          ? (sortDir === 'asc' ? <ChevronUp size={11} className="text-navy" /> : <ChevronDown size={11} className="text-navy" />)
                          : <ChevronsUpDown size={11} className="opacity-40" />
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-[#9aa0b8]">
                Loading...
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-[#9aa0b8]">
                {emptyText}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#fafbfe] transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 border-b border-[#dde2ee] align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#dde2ee] text-[11px] text-[#5a6380]">
      <span>
        Showing {(meta.current_page - 1) * meta.per_page + 1}–
        {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
      </span>
      <div className="flex items-center gap-1">
        <button
          className="px-2 py-1 rounded border border-[#dde2ee] hover:bg-[#f7f8fc] disabled:opacity-40"
          disabled={meta.current_page === 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          ‹
        </button>
        <span className="px-2">{meta.current_page} / {meta.last_page}</span>
        <button
          className="px-2 py-1 rounded border border-[#dde2ee] hover:bg-[#f7f8fc] disabled:opacity-40"
          disabled={meta.current_page === meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
