import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import StatCard from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiCalendarCheckLine, RiMoneyDollarCircleLine, RiAwardLine, RiBookOpenLine, RiCheckLine, RiCloseLine, RiArrowRightSLine } from 'react-icons/ri'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: profile } = useQuery({ queryKey: ['student-profile'], queryFn: () => api.get('/student/profile').then(r => r.data) })
  const { data: enrollments = [] } = useQuery({ queryKey: ['my-enrollments'], queryFn: () => api.get('/auth/enrollments').then(r => r.data) })
  const { data: attendanceArray = [] } = useQuery<any[]>({ queryKey: ['student-attendance'], queryFn: () => api.get('/student/attendance').then(r => r.data) })
  const { data: feesArray = [] } = useQuery<any[]>({ queryKey: ['student-fees'], queryFn: () => api.get('/student/fees').then(r => r.data) })
  const { data: eligibilityArray = [] } = useQuery<any[]>({ queryKey: ['student-eligibility'], queryFn: () => api.get('/student/eligibility').then(r => r.data) })
  const { data: certs = [] } = useQuery({ queryKey: ['student-certs'], queryFn: () => api.get('/student/certificates').then(r => r.data) })

  // Summary Aggregates
  const totalDays = attendanceArray.reduce((acc, curr) => acc + (curr.total || 0), 0)
  const presentDays = attendanceArray.reduce((acc, curr) => acc + (curr.present || 0), 0)
  const avgPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  const totalPaid = feesArray.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0)
  const totalDue = feesArray.reduce((acc, curr) => acc + (curr.dueAmount || 0), 0)

  // Primary enrollment eligibility
  const primaryEligibility = eligibilityArray[0] || null

  const Check = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <RiCheckLine className="text-emerald-500 flex-shrink-0" /> : <RiCloseLine className="text-red-500 flex-shrink-0" />}
      <span className={ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{label}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <p className="text-sm opacity-80 mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold">{user?.fullName || user?.username}</h2>
        <div className="flex flex-wrap gap-3 mt-3 text-sm opacity-90">
          <span>ID: {user?.studentId}</span>
          {enrollments.length > 0 && (
            <span>
              · {enrollments.length} Active {enrollments.length === 1 ? 'Enrollment' : 'Enrollments'}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Avg Attendance" value={`${avgPercentage}%`} icon={<RiCalendarCheckLine />} color="bg-blue-600" sub={`${presentDays}/${totalDays} total days`} />
        <StatCard title="Total Paid" value={formatCurrency(totalPaid)} icon={<RiMoneyDollarCircleLine />} color="bg-emerald-600" sub={`Total Due: ${formatCurrency(totalDue)}`} />
        <StatCard title="Certificates" value={certs.length} icon={<RiAwardLine />} color="bg-purple-600" />
        <StatCard title="Eligible" value={primaryEligibility?.eligible ? 'Yes' : 'No'} icon={<RiBookOpenLine />} color={primaryEligibility?.eligible ? 'bg-emerald-600' : 'bg-orange-500'} />
      </div>

      {/* Redesigned Course Cards Section */}
      {enrollments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">Enrolled Programs</h3>
            <a href="/student/courses" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              View All <RiArrowRightSLine />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((e: any) => (
              <Card key={e._id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{e.course?.title}</CardTitle>
                    <Badge variant={e.isActive ? 'success' : 'secondary'}>{e.isActive ? 'Ongoing' : 'Completed'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attendance:</span>
                    <span className="font-bold">{e.attendancePercentage || 0}%</span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Certificate Status</p>
                    <p className="text-sm font-medium">
                      {!e.isActive 
                        ? (e.attendancePercentage >= 75 && e.paidAmount >= e.totalFees ? "✅ Certificate available" : "⚠️ Pending — Complete requirements")
                        : "⏳ Ongoing — You will receive certificate after completion"}
                    </p>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={`/student/modules?course=${e.course?._id}`}>View Learning Resources</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligibility Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Certificate Eligibility</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {primaryEligibility ? (
              <>
                <Check ok={primaryEligibility.batchCompleted} label="Batch Completed" />
                <Check ok={primaryEligibility.feesCleared} label={`Fees Cleared${!primaryEligibility.feesCleared ? ` (Due: ${formatCurrency(primaryEligibility.dueAmount)})` : ''}`} />
                <Check ok={primaryEligibility.attendanceOk} label={`Attendance ${primaryEligibility.attendancePercentage}% (minimum 75%)`} />
                <div className={`mt-4 rounded-lg p-3 text-center text-sm font-semibold ${primaryEligibility.eligible ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'}`}>
                  {primaryEligibility.eligible ? 'You are eligible for certificate!' : 'Complete fees + 75% attendance + batch completion'}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground">Loading...</p>}
          </CardContent>
        </Card>

        {/* Batch Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Batch Information</CardTitle></CardHeader>
          <CardContent>
            {profile?.batch ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Batch:</span><span className="font-medium">{profile.batch.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Course:</span><span className="font-medium">{profile.course?.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Start:</span><span>{formatDate(profile.batch.startDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">End:</span><span>{formatDate(profile.batch.endDate)}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={new Date() >= new Date(profile.batch.endDate) ? 'success' : 'warning'}>
                    {new Date() >= new Date(profile.batch.endDate) ? 'Completed' : 'Ongoing'}
                  </Badge>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Loading...</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
