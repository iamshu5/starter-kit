export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`px-2.5 py-1.5 rounded-md border text-[12px] text-[#1a1f2e] bg-white outline-none transition-colors
          focus:border-navy-3 placeholder:text-[#9aa0b8]
          ${error ? 'border-red-400 bg-red-50' : 'border-[#dde2ee]'}
          ${props.readOnly ? 'bg-[#f7f8fc] text-[#5a6380]' : ''}
          ${className}`}
        {...props}
      />
      {error && <span className="text-[10px] text-red-500">{error}</span>}
      {hint && !error && <span className="text-[10px] text-[#9aa0b8]">{hint}</span>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={`px-2.5 py-1.5 rounded-md border text-[12px] text-[#1a1f2e] bg-white outline-none transition-colors
          focus:border-navy-3
          ${error ? 'border-red-400 bg-red-50' : 'border-[#dde2ee]'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  )
}

/**
 * Toggle — pakai bersama react-hook-form Controller:
 *
 *   <Controller name="is_active" control={control} render={({ field }) => (
 *     <Toggle label="Status" checked={field.value} onChange={field.onChange} />
 *   )} />
 */
export function Toggle({ label, checked, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-emerald-500 border-emerald-500' : 'bg-[#dde2ee] border-[#dde2ee]'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
            ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`}
        />
      </button>
      <span className={`text-[10px] font-medium ${checked ? 'text-emerald-600' : 'text-[#9aa0b8]'}`}>
        {checked ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}
