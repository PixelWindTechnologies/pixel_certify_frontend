import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiUserLine, RiMailLine, RiPhoneLine, RiIdCardLine } from 'react-icons/ri'
import { formatDate } from '@/lib/utils'

export default function StudentProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useQuery({ queryKey: ['student-profile'], queryFn: () => api.get('/student/profile').then(r => r.data) })

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold">
              {(user?.fullName || user?.username || 'S')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.fullName || user?.username}</h2>
              <p className="text-sm text-muted-foreground">{user?.studentId}</p>
              <Badge variant="default" className="mt-1">Student</Badge>
            </div>
          </div>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <div>
              <Row icon={<RiIdCardLine />} label="Student ID" value={profile?.studentId || '—'} />
              <Row icon={<RiUserLine />} label="Full Name" value={profile?.fullName || '—'} />
              <Row icon={<RiMailLine />} label="Email" value={profile?.email || '—'} />
              <Row icon={<RiPhoneLine />} label="Phone" value={profile?.phone || '—'} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight px-1">Enrolled Programs</h3>
        {profile?.activeEnrollments?.map((enrollment: any) => (
          <Card key={enrollment._id} className="border-l-4 border-l-blue-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{enrollment.course?.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch:</span>
                <span className="font-medium">{enrollment.batch?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student ID:</span>
                <span className="font-mono text-xs">{enrollment.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{formatDate(enrollment.batch?.startDate)} — {formatDate(enrollment.batch?.endDate)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
