import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function DataTable({
  columns,
  data,
  loading = false,
  emptyText = 'No data found.',
  sortBy,
  sortDir,
  onSort,
  rowOffset,
  mutating = false,
}) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  const hasRowNum = rowOffset !== undefined
  const colCount = columns.length + (hasRowNum ? 1 : 0)

  return (
    <div className="overflow-x-auto relative">
      {mutating && (
        <div className="absolute inset-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-[12px] text-[#5a6380] bg-white dark:bg-slate-800 rounded-lg shadow-md px-4 py-2.5 border border-[#dde2ee] dark:border-slate-700">
            <Spinner />
            Loading...
          </div>
        </div>
      )}

      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hasRowNum && (
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#9aa0b8] uppercase tracking-wide border-b border-[#dde2ee] bg-[#f7f8fc] w-10 dark:bg-slate-800 dark:border-slate-700">
                  #
                </th>
              )}
              {hg.headers.map((header) => {
                const sortable = onSort && header.column.columnDef.meta?.sortable
                const isActive = sortable && sortBy === header.column.id
                return (
                  <th
                    key={header.id}
                    onClick={sortable ? () => onSort(header.column.id) : undefined}
                    className={`px-3 py-2.5 text-left text-[10px] font-semibold text-[#9aa0b8] uppercase tracking-wide border-b border-[#dde2ee] bg-[#f7f8fc] whitespace-nowrap dark:bg-slate-800 dark:border-slate-700${sortable ? ' cursor-pointer select-none hover:text-[#5a6380]' : ''}`}
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
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {hasRowNum && (
                  <td className="px-3 py-2.5 border-b border-[#dde2ee] dark:border-slate-700">
                    <div className="h-3.5 rounded bg-[#e8edf5] dark:bg-slate-700 animate-pulse w-6" />
                  </td>
                )}
                {columns.map((_, j) => (
                  <td key={j} className="px-3 py-2.5 border-b border-[#dde2ee] dark:border-slate-700">
                    <div className="h-3.5 rounded bg-[#e8edf5] dark:bg-slate-700 animate-pulse" style={{ width: `${55 + (j * 17 + i * 11) % 35}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-3 py-8 text-center text-[#9aa0b8]">
                {emptyText}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-[#fafbfe] dark:hover:bg-slate-800/60 transition-colors">
                {hasRowNum && (
                  <td className="px-3 py-2.5 border-b border-[#dde2ee] dark:border-slate-700 align-middle text-[11px] font-mono text-[#9aa0b8] w-10">
                    {rowOffset + index + 1}
                  </td>
                )}
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 border-b border-[#dde2ee] dark:border-slate-700 align-middle">
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

export function Pagination({ meta, onPageChange, disabled = false }) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#dde2ee] dark:border-slate-700 text-[11px] text-[#5a6380]">
      <span>
        Showing {(meta.current_page - 1) * meta.per_page + 1}–
        {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
      </span>
      <div className="flex items-center gap-1">
        <button
          className="px-2 py-1 rounded border border-[#dde2ee] dark:border-slate-700 hover:bg-[#f7f8fc] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={meta.current_page === 1 || disabled}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          ‹
        </button>
        <span className="px-2">{meta.current_page} / {meta.last_page}</span>
        <button
          className="px-2 py-1 rounded border border-[#dde2ee] dark:border-slate-700 hover:bg-[#f7f8fc] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={meta.current_page === meta.last_page || disabled}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  )
}
