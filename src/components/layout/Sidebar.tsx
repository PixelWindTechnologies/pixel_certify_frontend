import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  RiDashboardLine, RiUserLine, RiGroupLine, RiBookOpenLine,
  RiCalendarCheckLine, RiMoneyDollarCircleLine, RiAwardLine,
  RiBellLine, RiBarChartLine, RiFolderLine, RiShieldUserLine
} from 'react-icons/ri'

interface NavItem { label: string; to: string; icon: React.ReactNode }

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: <RiDashboardLine /> },
  { label: 'Admins', to: '/super-admin/admins', icon: <RiShieldUserLine /> },
  { label: 'Students', to: '/super-admin/students', icon: <RiGroupLine /> },
  { label: 'Courses', to: '/super-admin/courses', icon: <RiBookOpenLine /> },
  { label: 'Batches', to: '/super-admin/batches', icon: <RiCalendarCheckLine /> },
  { label: 'Attendance', to: '/super-admin/attendance', icon: <RiCalendarCheckLine /> },
  { label: 'Fees', to: '/super-admin/fees', icon: <RiMoneyDollarCircleLine /> },
  { label: 'Modules', to: '/super-admin/modules', icon: <RiFolderLine /> },
  { label: 'Certificates', to: '/super-admin/certificates', icon: <RiAwardLine /> },
  { label: 'Notifications', to: '/super-admin/notifications', icon: <RiBellLine /> },
  { label: 'Analytics', to: '/super-admin/analytics', icon: <RiBarChartLine /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <RiDashboardLine /> },
  { label: 'Students', to: '/admin/students', icon: <RiGroupLine /> },
  { label: 'Courses', to: '/admin/courses', icon: <RiBookOpenLine /> },
  { label: 'Batches', to: '/admin/batches', icon: <RiCalendarCheckLine /> },
  { label: 'Attendance', to: '/admin/attendance', icon: <RiCalendarCheckLine /> },
  { label: 'Fees', to: '/admin/fees', icon: <RiMoneyDollarCircleLine /> },
  { label: 'Modules', to: '/admin/modules', icon: <RiFolderLine /> },
  { label: 'Certificates', to: '/admin/certificates', icon: <RiAwardLine /> },
  { label: 'Notifications', to: '/admin/notifications', icon: <RiBellLine /> },
  { label: 'Analytics', to: '/admin/analytics', icon: <RiBarChartLine /> },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard', to: '/student/dashboard', icon: <RiDashboardLine /> },
  { label: 'Attendance', to: '/student/attendance', icon: <RiCalendarCheckLine /> },
  { label: 'Fees', to: '/student/fees', icon: <RiMoneyDollarCircleLine /> },
  { label: 'Modules', to: '/student/modules', icon: <RiFolderLine /> },
  { label: 'Certificates', to: '/student/certificates', icon: <RiAwardLine /> },
  { label: 'Notifications', to: '/student/notifications', icon: <RiBellLine /> },
  { label: 'Profile', to: '/student/profile', icon: <RiUserLine /> },
]

export default function Sidebar() {
  const { user } = useAuth()

  const navItems =
    user?.role === 'SUPER_ADMIN' ? superAdminNav :
    user?.role === 'ADMIN' ? adminNav : studentNav

  const roleLabel =
    user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
    user?.role === 'ADMIN' ? 'Admin Panel' : 'Student Portal'

  return (
    <aside className="sidebar flex h-full w-64 flex-col">
      {/* Logo */}
      <div className="flex h-28 items-center gap-3 border-b border-white/10 px-6">
        <img src="/logo.ico" alt="PixelWind Logo" className="h-24 w-24 rounded-lg object-contain bg-white/10 p-1" />
        <div>
          <p className="text-lg font-bold tracking-wide">PixelWind</p>
          <p className="text-xs opacity-80 uppercase tracking-wider">{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'sidebar-item flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'active text-white' : 'opacity-75 hover:opacity-100'
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
            {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.fullName || user?.username}</p>
            <p className="truncate text-xs opacity-60">{user?.employeeId || user?.studentId || ''}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
