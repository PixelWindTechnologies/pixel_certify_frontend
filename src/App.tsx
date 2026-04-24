import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Super Admin pages
import SuperAdminDashboard from '@/pages/superadmin/Dashboard'
import AdminsPage from '@/pages/superadmin/AdminsPage'

// Shared admin pages
import StudentsPage from '@/pages/admin/StudentsPage'
import CoursesPage from '@/pages/admin/CoursesPage'
import BatchesPage from '@/pages/admin/BatchesPage'
import AttendancePage from '@/pages/admin/AttendancePage'
import FeesPage from '@/pages/admin/FeesPage'
import ModulesPage from '@/pages/admin/ModulesPage'
import CertificatesAdminPage from '@/pages/admin/CertificatesAdminPage'
import NotificationsPage from '@/pages/admin/NotificationsPage'
import AnalyticsPage from '@/pages/admin/AnalyticsPage'
import AdminDashboard from '@/pages/admin/Dashboard'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentAttendancePage from '@/pages/student/AttendancePage'
import MyCoursesPage from '@/pages/student/MyCoursesPage'
import StudentFeesPage from '@/pages/student/FeesPage'
import StudentModulesPage from '@/pages/student/ModulesPage'
import StudentCertificatesPage from '@/pages/student/CertificatesPage'
import StudentNotificationsPage from '@/pages/student/NotificationsPage'
import StudentProfilePage from '@/pages/student/ProfilePage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>
  if (!user) return <Navigate to="/" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  // Force first login password change
  if (user.isFirstLogin && user.role === 'ADMIN' && window.location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />
  }
  if (user.isFirstLogin && user.role === 'STUDENT' && window.location.pathname !== '/student/change-password') {
    return <Navigate to="/student/change-password" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Loading PixelWind...</div>

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to={`/${user.role.toLowerCase().replace('_', '-')}/dashboard`} replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Change password routes (no layout) */}
      <Route path="/admin/change-password" element={<ProtectedRoute roles={['ADMIN']}><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="/student/change-password" element={<ProtectedRoute roles={['STUDENT']}><ChangePasswordPage /></ProtectedRoute>} />

      {/* Super Admin routes */}
      <Route path="/super-admin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="admins" element={<AdminsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="certificates" element={<CertificatesAdminPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="certificates" element={<CertificatesAdminPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="courses" element={<MyCoursesPage />} />
        <Route path="fees" element={<StudentFeesPage />} />
        <Route path="modules" element={<StudentModulesPage />} />
        <Route path="certificates" element={<StudentCertificatesPage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
