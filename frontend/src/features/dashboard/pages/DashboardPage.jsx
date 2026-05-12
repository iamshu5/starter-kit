import { useQuery } from '@tanstack/react-query'
import { Users, Shield, Menu, LayoutDashboard } from 'lucide-react'
import { usersApi } from '@/services/api/users'
import { rolesApi } from '@/services/api/roles'
import { menusApi } from '@/services/api/menus'
import { useAuthStore } from '@/stores/authStore'
import { PageHeader } from '@/components/ui/PageHeader'

function StatCard({ icon: Icon, label, value, color = 'navy' }) {
  const bg = { navy: 'bg-navy-light', gold: 'bg-gold-light', green: 'bg-[#e6f5ed]', blue: 'bg-[#e8f0fd]' }
  const text = { navy: 'text-navy', gold: 'text-gold-2', green: 'text-[#1a7a4a]', blue: 'text-[#2d6be4]' }

  return (
    <div className="bg-white border border-[#dde2ee] rounded-xl p-4 shadow-card">
      <div className={`w-8 h-8 rounded-lg ${bg[color]} flex items-center justify-center mb-3`}>
        <Icon size={16} className={text[color]} />
      </div>
      <div className="text-[10px] text-[#9aa0b8] font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-[22px] font-semibold font-mono text-navy mt-1">{value ?? '—'}</div>
    </div>
  )
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: users }   = useQuery({ queryKey: ['users', { per_page: 1 }],   queryFn: () => usersApi.list({ per_page: 1 }).then((r) => r.data) })
  const { data: roles }   = useQuery({ queryKey: ['roles'],   queryFn: () => rolesApi.list().then((r) => r.data) })
  const { data: menus }   = useQuery({ queryKey: ['menus'],   queryFn: () => menusApi.flat().then((r) => r.data) })

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`${user?.role?.name || '-'}`}
      />

      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}           label="Total Users"   value={users?.meta?.total}            color="navy" />
        <StatCard icon={Shield}          label="Total Roles"   value={roles?.data?.length}           color="gold" />
        <StatCard icon={Menu}            label="Total Menus"   value={menus?.data?.length}           color="green" />
        <StatCard icon={LayoutDashboard} label="Active"        value="Online"                        color="blue" />
      </div>
    </div>
  )
}
