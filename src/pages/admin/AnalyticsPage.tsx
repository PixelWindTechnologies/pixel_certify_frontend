import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import StatCard from '@/components/ui/StatCard'
import { RiGroupLine, RiAwardLine, RiMoneyDollarCircleLine, RiCalendarCheckLine, RiFilter3Line } from 'react-icons/ri'
import { formatCurrency } from '@/lib/utils'

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444']

interface Course { _id: string; title: string }
interface Batch { _id: string; title: string; course: { _id: string; title: string } }

export default function AnalyticsPage() {
  const [courseFilter, setCourseFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const filters = {
    course: courseFilter === 'all' ? undefined : courseFilter,
    batch: batchFilter === 'all' ? undefined : batchFilter,
    date: dateFilter || undefined
  }

  // Use placeholderData to prevent the UI from flickering to placeholders ("—") while filtering
  const { data: overview } = useQuery({ 
    queryKey: ['analytics-overview', filters], 
    queryFn: () => api.get('/analytics/overview', { params: filters }).then(r => r.data),
    placeholderData: (prev) => prev
  })
  const { data: growth } = useQuery({ 
    queryKey: ['student-growth', filters], 
    queryFn: () => api.get('/analytics/student-growth', { params: filters }).then(r => r.data),
    placeholderData: (prev) => prev
  })
  const { data: attendance } = useQuery({ 
    queryKey: ['attendance-stats', filters], 
    queryFn: () => api.get('/analytics/attendance-stats', { params: filters }).then(r => r.data),
    placeholderData: (prev) => prev
  })
  const { data: feeData } = useQuery({ 
    queryKey: ['fee-collection', filters], 
    queryFn: () => api.get('/analytics/fee-collection', { params: filters }).then(r => r.data),
    placeholderData: (prev) => prev
  })
  const { data: certData } = useQuery({ 
    queryKey: ['cert-issued', filters], 
    queryFn: () => api.get('/analytics/certificates-issued', { params: filters }).then(r => r.data),
    placeholderData: (prev) => prev
  })

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses').then(r => r.data) })
  const { data: batches = [] } = useQuery<Batch[]>({ queryKey: ['batches'], queryFn: () => api.get('/batches').then(r => r.data) })

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Course</Label>
            <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setBatchFilter('all'); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All Courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Batch</Label>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All Batches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches
                  .filter(b => courseFilter === 'all' || b.course?._id === courseFilter)
                  .map(b => <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Activity Date</Label>
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-48" />
          </div>
          {(courseFilter !== 'all' || batchFilter !== 'all' || dateFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setCourseFilter('all'); setBatchFilter('all'); setDateFilter(''); }}>Reset</Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={overview?.totalStudents ?? '—'} icon={<RiGroupLine />} color="bg-blue-600" />
        <StatCard title="Certificates Issued" value={overview?.totalCertificates ?? '—'} icon={<RiAwardLine />} color="bg-purple-600" />
        <StatCard title="Fee Collected" value={overview ? formatCurrency(overview.totalCollected) : '—'} icon={<RiMoneyDollarCircleLine />} color="bg-emerald-600" sub={overview ? `Total: ${formatCurrency(overview.totalFees)}` : ''} />
        <StatCard title="Avg Attendance" value={overview ? `${overview.avgAttendance}%` : '—'} icon={<RiCalendarCheckLine />} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Student Enrollment Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growth || []}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} name="Students" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={attendance || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {(attendance || []).map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Fee Collection by Batch</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={feeData || []}>
                <XAxis dataKey="batch" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" fill="#ef4444" name="Due" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Certificates Issued</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={certData || []}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
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
