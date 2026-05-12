import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const maxW = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`relative bg-white rounded-xl border border-[#dde2ee] w-full ${maxW[size]} max-h-[90vh] flex flex-col shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dde2ee] shrink-0">
          <h3 className="text-[14px] font-semibold text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded border border-[#dde2ee] text-[#5a6380] hover:bg-[#f7f8fc] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#dde2ee] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
