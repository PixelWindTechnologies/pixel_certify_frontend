import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { RiCalendarCheckLine } from 'react-icons/ri'

const statusVariant: Record<string, 'success' | 'danger' | 'warning'> = { PRESENT: 'success', ABSENT: 'danger', LATE: 'warning' }

export default function StudentAttendancePage() {
  const { data: attendanceArray = [], isLoading } = useQuery<any[]>({ queryKey: ['student-attendance'], queryFn: () => api.get('/student/attendance').then(r => r.data) })
  const { data: enrollments = [] } = useQuery<any[]>({ queryKey: ['my-enrollments'], queryFn: () => api.get('/auth/enrollments').then(r => r.data) })

  return (
    <div className="space-y-4">
      {isLoading ? <p>Loading attendance...</p> : attendanceArray.map((data) => {
        const enrollment = enrollments.find(e => e._id === data.enrollmentId);
        return (
          <div key={data.enrollmentId} className="space-y-4 border-b pb-8 last:border-0">
            <h3 className="text-lg font-bold">{enrollment?.course?.title || 'Course Attendance'}</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{data.total}</p><p className="text-sm text-muted-foreground">Total Days</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{data.present}</p><p className="text-sm text-muted-foreground">Present</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{data.percentage}%</p><p className="text-sm text-muted-foreground">Percentage</p></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress in {enrollment?.batch?.title}</span>
                  <span className={data.percentage >= 75 ? 'text-emerald-600' : 'text-red-500'}>{data.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full transition-all ${data.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${data.percentage}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Records</CardTitle></CardHeader>
              <CardContent>
                {!data.records?.length ? <p className="text-sm text-muted-foreground text-center py-4">No records yet.</p> : (
                  <div className="space-y-2">
                    {data.records.slice(0, 10).map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="text-sm">
                          <p className="font-medium">{formatDate(r.attendanceDate)}</p>
                          <p className="text-xs text-muted-foreground">By: {r.markedByUsername}</p>
                        </div>
                        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  )
}
