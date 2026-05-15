import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const ACTIVE_BARS = { green: 3, yellow: 2, red: 1, offline: 0 }

const BAR_COLOR = {
  green: 'bg-green-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  offline: 'bg-gray-400',
}

const STATUS_LABEL = {
  green: 'Koneksi Baik',
  yellow: 'Koneksi Sedang',
  red: 'Koneksi Buruk',
  offline: 'Tidak Ada Jaringan',
}

export function NetworkIndicator() {
  const { status, latency } = useNetworkStatus()

  const active = ACTIVE_BARS[status]
  const color = BAR_COLOR[status]
  const label = STATUS_LABEL[status]
  const title = latency != null ? `${label} · ${latency}ms` : label

  return (
    <div
      className="flex items-center gap-1.5 cursor-default select-none"
      title={title}
      aria-label={title}
    >
      {/* 3-bar signal icon */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`w-0.75 rounded-sm transition-colors duration-500 ${
              level <= active ? color : 'bg-white/20'
            }`}
            style={{ height: `${4 + level * 3}px` }}
          />
        ))}
      </div>

      {/* Latency in ms — hidden on small screens */}
      {latency != null && (
        <span className="hidden sm:block text-[10px] leading-none tabular-nums text-white/50">
          {latency}ms
        </span>
      )}
    </div>
  )
}
