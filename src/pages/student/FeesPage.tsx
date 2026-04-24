import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { RiMoneyDollarCircleLine } from 'react-icons/ri'

export default function StudentFeesPage() {
  const { data: feesArray = [], isLoading } = useQuery<any[]>({ queryKey: ['student-fees'], queryFn: () => api.get('/student/fees').then(r => r.data) })
  const { data: enrollments = [] } = useQuery<any[]>({ queryKey: ['my-enrollments'], queryFn: () => api.get('/auth/enrollments').then(r => r.data) })

  return (
    <div className="space-y-4 max-w-lg">
      {isLoading ? <p>Loading fees...</p> : feesArray.map((data) => {
        const enrollment = enrollments.find(e => e._id === data.enrollmentId);
        const paidPct = Math.round((data.paidAmount / (data.totalFees || 1)) * 100);
        
        return (
          <Card key={data.enrollmentId} className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                  <RiMoneyDollarCircleLine />
                </div>
                <div>
                  <CardTitle className="text-base">{enrollment?.course?.title || 'Fee Summary'}</CardTitle>
                  <p className="text-xs text-muted-foreground">{enrollment?.batch?.title}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Fees</span>
                  <span className="font-bold">{formatCurrency(data.totalFees)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(data.paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Due Amount</span>
                  <span className={`font-bold ${data.dueAmount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(data.dueAmount)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Payment Progress</span>
                  <span>{paidPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} />
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Badge variant={data.dueAmount === 0 ? 'success' : 'warning'} className="text-sm px-4 py-1">
                  {data.dueAmount === 0 ? 'Fees Fully Paid' : 'Payment Pending'}
                </Badge>
              </div>

              {data.dueAmount > 0 && (
                <p className="text-xs text-muted-foreground text-center italic">
                  Please contact admin to clear your pending fees of {formatCurrency(data.dueAmount)}.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  )
}
