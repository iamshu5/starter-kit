const colors = {
  green:  'bg-[#e6f5ed] text-[#1a7a4a]',
  red:    'bg-[#fdecea] text-[#c0392b]',
  amber:  'bg-[#fef3cd] text-[#b45309]',
  blue:   'bg-[#e8f0fd] text-[#2d6be4]',
  navy:   'bg-[#e8eef8] text-[#1a3a6b]',
  gold:   'bg-[#f5edd8] text-[#a8893e]',
  gray:   'bg-[#f1f0ec] text-[#5a6380]',
  purple: 'bg-[#ede9ff] text-[#5b3fa0]',
}

export function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap
      before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current
      ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
