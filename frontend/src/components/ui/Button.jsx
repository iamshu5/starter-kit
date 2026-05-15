const variants = {
  primary: 'bg-[#1a3a6b] text-white hover:bg-[#22468a] border-[#1a3a6b]',
  gold:    'bg-[#FFBF40] text-white font-semibold hover:bg-[#F0B237] hover:text-white border-[#FFBF40]',
  outline: 'bg-transparent text-[#1a3a6b] border-[#1a3a6b] hover:bg-[#e8eef8]',
  danger:  'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
  ghost:   'bg-white text-[#5a6380] border-[#dde2ee] hover:bg-[#f7f8fc]',
}

const sizes = {
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3.5 py-1.5 text-[11px]',
  lg: 'px-4 py-2 text-[12px]',
}

export function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
