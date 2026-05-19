import ReactSelect from 'react-select'

function buildStyles(hasError) {
  return {
    control: (base, state) => ({
      ...base,
      minHeight: '30px',
      fontSize: '12px',
      borderColor: hasError ? '#f87171' : state.isFocused ? '#3a4060' : '#dde2ee',
      borderRadius: '6px',
      boxShadow: 'none',
      backgroundColor: hasError ? '#fef2f2' : 'white',
      '&:hover': { borderColor: '#3a4060' },
      cursor: 'pointer',
    }),
    valueContainer: (base) => ({ ...base, padding: '0 10px', minHeight: '28px' }),
    input: (base) => ({ ...base, fontSize: '12px', color: '#1a1f2e', margin: 0, padding: 0 }),
    singleValue: (base) => ({ ...base, fontSize: '12px', color: '#1a1f2e' }),
    placeholder: (base) => ({ ...base, fontSize: '12px', color: '#9aa0b8' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, padding: '0 6px', color: '#9aa0b8' }),
    clearIndicator: (base) => ({ ...base, padding: '0 4px', color: '#9aa0b8' }),
    menu: (base) => ({
      ...base,
      fontSize: '12px',
      borderRadius: '6px',
      border: '1px solid #dde2ee',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      zIndex: 9999,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      fontSize: '12px',
      color: state.isSelected ? 'white' : '#1a1f2e',
      backgroundColor: state.isSelected ? '#1a2744' : state.isFocused ? '#f0f2fa' : 'white',
      cursor: 'pointer',
      padding: '6px 10px',
    }),
    loadingMessage: (base) => ({ ...base, fontSize: '12px', color: '#9aa0b8' }),
    noOptionsMessage: (base) => ({ ...base, fontSize: '12px', color: '#9aa0b8' }),
  }
}

export function SearchableSelect({
  label,
  error,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  isClearable = false,
  isLoading = false,
  isDisabled = false,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide">
          {label}
        </label>
      )}
      <ReactSelect
        styles={buildStyles(!!error)}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isLoading={isLoading}
        isDisabled={isDisabled}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        noOptionsMessage={() => 'No options'}
        loadingMessage={() => 'Loading...'}
      />
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  )
}
