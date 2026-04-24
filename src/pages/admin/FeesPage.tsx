import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { RiMoneyDollarCircleLine, RiSearchLine, RiAddLine } from 'react-icons/ri'
import { formatCurrency } from '@/lib/utils'

interface FeeRecord { _id: string; studentId: string; fullName: string; totalFees: number; paidAmount: number; dueAmount: number; course: { title: string }; batch: { title: string } }
interface Course { _id: string; title: string }

export default function FeesPage() {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selected, setSelected] = useState<FeeRecord | null>(null)
  const [manualStudentId, setManualStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: fees = [], isLoading } = useQuery<FeeRecord[]>({ 
    queryKey: ['fees', statusFilter, dateFilter, courseFilter], 
    queryFn: () => api.get('/fees', { 
      params: { 
        feeStatus: statusFilter === 'all' ? undefined : statusFilter, 
        date: dateFilter || undefined,
        course: courseFilter === 'all' ? undefined : courseFilter
      } 
    }).then(r => r.data) 
  })

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses').then(r => r.data) })

  const paymentMutation = useMutation({
    mutationFn: (data: { enrollmentId: string; amount: number }) => api.post('/fees/payment', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fees'] }); toast({ title: 'Payment recorded', variant: 'success' } as never); setPaymentOpen(false); setAmount('') },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message || 'Payment failed', variant: 'destructive' }),
  })

  const openPayment = (f: FeeRecord | null = null) => { 
    setSelected(f); 
    setManualStudentId(f?.studentId || '');
    setAmount(''); 
    setPaymentOpen(true) 
  }

  const studentEnrollments = fees.filter(f => f.studentId === manualStudentId)
  const activeRecord = selected || (studentEnrollments.length === 1 ? studentEnrollments[0] : null)

  const filtered = fees.filter(f =>
    f.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    f.studentId?.toLowerCase().includes(search.toLowerCase())
  )

  const totalCollected = fees.reduce((s, f) => s + f.paidAmount, 0)
  const totalDue = fees.reduce((s, f) => s + f.dueAmount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Collected</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Due</p><p className="text-xl font-bold text-red-500">{formatCurrency(totalDue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Students</p><p className="text-xl font-bold">{fees.length}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
        <div className="relative w-64">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Course</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fee Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              <SelectItem value="CLEARED">Fees Completed</SelectItem>
              <SelectItem value="DUE">Fees Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Paid on Date</Label>
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        </div>
        {(statusFilter !== 'all' || dateFilter || courseFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setDateFilter(''); setCourseFilter('all') }}>Reset</Button>
        )}
        </div>
        <Button onClick={() => openPayment()}><RiAddLine className="mr-2" /> Record Payment</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No fee records found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(f => (
            <Card key={f._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <RiMoneyDollarCircleLine className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{f.fullName} <span className="text-muted-foreground text-sm">({f.studentId})</span></p>
                      <p className="text-sm text-muted-foreground">{f.course?.title} · {f.batch?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-sm space-y-0.5">
                      <div className="flex gap-6">
                        <span className="text-muted-foreground">Total:</span><span className="font-medium">{formatCurrency(f.totalFees)}</span>
                      </div>
                      <div className="flex gap-6">
                        <span className="text-muted-foreground">Paid:</span><span className="font-medium text-emerald-600">{formatCurrency(f.paidAmount)}</span>
                      </div>
                      <div className="flex gap-6">
                        <span className="text-muted-foreground">Due:</span><span className="font-medium text-red-500">{formatCurrency(f.dueAmount)}</span>
                      </div>
                    </div>
                    <Badge variant={f.dueAmount === 0 ? 'success' : 'warning'}>{f.dueAmount === 0 ? 'Cleared' : 'Pending'}</Badge>
                    {f.dueAmount > 0 && (
                      <Button size="sm" onClick={() => openPayment(f)}>Add Payment</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? `Record Payment - ${selected.fullName}` : 'Record New Payment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selected && (
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={manualStudentId} onValueChange={setManualStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(fees.map(f => f.studentId))).map(sid => {
                      const student = fees.find(f => f.studentId === sid);
                      return <SelectItem key={sid} value={sid}>{student?.fullName} ({sid})</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {manualStudentId && studentEnrollments.length > 1 && !selected && (
              <div className="space-y-2">
                <Label>Select Enrollment</Label>
                <Select value={activeRecord?._id} onValueChange={v => setSelected(fees.find(f => f._id === v) || null)}>
                  <SelectTrigger><SelectValue placeholder="Choose course/batch" /></SelectTrigger>
                  <SelectContent>
                    {studentEnrollments.map(e => (
                      <SelectItem key={e._id} value={e._id}>{e.course?.title} ({e.batch?.title})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeRecord && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total Fees:</span><span>{formatCurrency(activeRecord.totalFees)}</span></div>
                <div className="flex justify-between"><span>Already Paid:</span><span className="text-emerald-600">{formatCurrency(activeRecord.paidAmount)}</span></div>
                <div className="flex justify-between font-semibold"><span>Due Amount:</span><span className="text-red-500">{formatCurrency(activeRecord.dueAmount)}</span></div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Payment Amount (INR)</Label>
              <Input type="number" max={activeRecord?.dueAmount} placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className={activeRecord && Number(amount) > activeRecord.dueAmount ? 'border-red-500 focus-visible:ring-red-500' : ''} />
              {activeRecord && Number(amount) > activeRecord.dueAmount && <p className="text-xs text-red-500 font-medium">Amount cannot exceed due balance of {formatCurrency(activeRecord.dueAmount)}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button disabled={!activeRecord || !amount || paymentMutation.isPending || Number(amount) > activeRecord.dueAmount || Number(amount) <= 0} onClick={() => activeRecord && paymentMutation.mutate({ enrollmentId: activeRecord._id, amount: Number(amount) })}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
