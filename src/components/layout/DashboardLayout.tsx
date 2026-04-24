import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  admins: 'Admin Management',
  students: 'Student Management',
  courses: 'Course Management',
  batches: 'Batch Management',
  attendance: 'Attendance',
  fees: 'Fees Management',
  modules: 'Learning Modules',
  certificates: 'Certificates',
  notifications: 'Notifications',
  analytics: 'Analytics',
  profile: 'My Profile',
}

export default function DashboardLayout() {
  const location = useLocation()
  const segments = location.pathname.split('/')
  const last = segments[segments.length - 1]
  const title = pageTitles[last] || 'PixelWind'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
