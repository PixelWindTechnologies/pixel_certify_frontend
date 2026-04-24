import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiGraduationCapLine, RiCalendarLine, RiMoneyDollarCircleLine, RiInformationLine, RiTimeLine } from 'react-icons/ri'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Enrollment {
  _id: string;
  course: { _id: string; title: string; description: string; duration?: string };
  batch: { _id: string; title: string; startDate: string; endDate: string };
  totalFees: number;
  paidAmount: number;
  isActive: boolean;
  createdAt: string;
}

export default function MyCoursesPage() {
  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ['my-enrollments'],
    queryFn: () => api.get('/auth/enrollments').then(r => r.data)
  })

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading your courses...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground text-sm">Overview of all programs you are currently enrolled in or have completed.</p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <RiInformationLine className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>You are not enrolled in any courses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment._id} className="group transition-all hover:shadow-md border-l-4 border-l-emerald-500 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                    <RiGraduationCapLine size={24} />
                  </div>
                  <Badge variant={enrollment.isActive ? 'success' : 'secondary'}>
                    {enrollment.isActive ? 'Active' : 'Completed'}
                  </Badge>
                </div>
                <div className="mt-4">
                  <CardTitle className="text-lg leading-6 group-hover:text-emerald-600 transition-colors">
                    {enrollment.course?.title || 'Course Title'}
                  </CardTitle>
                  <CardDescription className="font-medium text-emerald-600/80">
                    {enrollment.batch?.title || 'Batch Title'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {enrollment.course?.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RiCalendarLine className="text-emerald-500" />
                    <span>{formatDate(enrollment.batch?.startDate)} — {formatDate(enrollment.batch?.endDate)}</span>
                  </div>
                  {enrollment.course?.duration && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RiTimeLine className="text-emerald-500" />
                      <span>Duration: {enrollment.course.duration}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-muted-foreground/10 mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <RiMoneyDollarCircleLine className="text-emerald-500" />
                      Payment Status
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${enrollment.totalFees - enrollment.paidAmount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {enrollment.totalFees - enrollment.paidAmount === 0 ? 'CLEARED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Fees</p>
                      <p className="text-sm font-bold">{formatCurrency(enrollment.totalFees)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Paid Amount</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(enrollment.paidAmount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}