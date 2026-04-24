import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import StatCard from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { RiGroupLine, RiAwardLine, RiMoneyDollarCircleLine, RiCalendarCheckLine } from 'react-icons/ri'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#22c55e', '#f59e0b', '#ef4444']

export default function SuperAdminDashboard() {
  const { data: overview } = useQuery({ queryKey: ['analytics-overview'], queryFn: () => api.get('/analytics/overview').then(r => r.data) })
  const { data: growth } = useQuery({ queryKey: ['student-growth'], queryFn: () => api.get('/analytics/student-growth').then(r => r.data) })
  const { data: attendance } = useQuery({ queryKey: ['attendance-stats'], queryFn: () => api.get('/analytics/attendance-stats').then(r => r.data) })
  const { data: certData } = useQuery({ queryKey: ['cert-issued'], queryFn: () => api.get('/analytics/certificates-issued').then(r => r.data) })

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={overview?.totalStudents ?? '—'} icon={<RiGroupLine />} color="bg-blue-600" />
        <StatCard title="Certificates Issued" value={overview?.totalCertificates ?? '—'} icon={<RiAwardLine />} color="bg-purple-600" />
        <StatCard title="Fee Collected" value={overview ? formatCurrency(overview.totalCollected) : '—'} icon={<RiMoneyDollarCircleLine />} color="bg-emerald-600" sub={overview ? `Due: ${formatCurrency(overview.totalFees - overview.totalCollected)}` : ''} />
        <StatCard title="Avg Attendance" value={overview ? `${overview.avgAttendance}%` : '—'} icon={<RiCalendarCheckLine />} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Growth */}
        <Card>
          <CardHeader><CardTitle className="text-base">Student Enrollment</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={growth || []}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={attendance || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(attendance || []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader><CardTitle className="text-base">Certificates Issued</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={certData || []}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#9333ea" radius={[4, 4, 0, 0]} name="Certificates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
