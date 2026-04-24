import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { RiAwardLine, RiAddLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { formatDate, formatDateTime } from '@/lib/utils'

interface Certificate { _id: string; certificateId: string; studentName: string; studentId: string; courseName: string; batchTitle: string; startDate: string; completionDate: string; attendancePercentage: number; issuedAt: string }
interface Student { 
  _id: string; 
  studentId: string; 
  fullName: string; 
  enrollmentId?: string; 
  course?: { title: string } 
}
interface Eligibility { eligible: boolean; batchCompleted: boolean; feesCleared: boolean; attendanceOk: boolean; attendancePercentage: number; dueAmount: number }

export default function CertificatesAdminPage() {
  const [open, setOpen] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({ queryKey: ['certificates'], queryFn: () => api.get('/certificates').then(r => r.data) })
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => api.get('/admin').then(r => r.data) })

  const issueMutation = useMutation({
    mutationFn: (enrollmentId: string) => api.post(`/certificates/issue/${enrollmentId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['certificates'] }); toast({ title: 'Certificate issued', variant: 'success' } as never); setOpen(false); setEligibility(null); setSelectedEnrollmentId('') },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'; toast({ title: 'Error', description: msg, variant: 'destructive' }) },
  })

  const checkEligibility = async () => {
    if (!selectedEnrollmentId) return
    setCheckLoading(true)
    try {
      const res = await api.get(`/certificates/eligibility/${selectedEnrollmentId}`)
      setEligibility(res.data)
    } catch {
      toast({ title: 'Error', description: 'Failed to check eligibility', variant: 'destructive' })
    } finally {
      setCheckLoading(false)
    }
  }

  const EligibilityCheck = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <RiCheckLine className="text-emerald-500" /> : <RiCloseLine className="text-red-500" />}
      <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{label}</span>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><RiAddLine className="mr-2" /> Issue Certificate</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : certificates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No certificates issued yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {certificates.map(c => (
            <Card key={c._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <RiAwardLine className="text-yellow-600 text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{c.studentName}</p>
                        <Badge variant="outline" className="text-xs">{c.studentId}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.courseName} · {c.batchTitle}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(c.startDate)} to {formatDate(c.completionDate)} · {c.attendancePercentage}% attendance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">{c.certificateId}</p>
                    <p className="text-xs text-muted-foreground">Issued {formatDateTime(c.issuedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEligibility(null); setSelectedEnrollmentId('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Certificate</DialogTitle>
            <DialogDescription className="sr-only">Check eligibility and issue new certificate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Enrollment</Label>
              <Select value={selectedEnrollmentId} onValueChange={v => { setSelectedEnrollmentId(v); setEligibility(null) }}>
                <SelectTrigger><SelectValue placeholder="Select enrollment" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s._id} value={s.enrollmentId || ''}>{s.fullName} ({s.studentId}) - {s.course?.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedEnrollmentId && !eligibility && (
              <Button variant="outline" onClick={checkEligibility} disabled={checkLoading} className="w-full">
                {checkLoading ? 'Checking...' : 'Check Eligibility'}
              </Button>
            )}
            {eligibility && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-medium text-sm mb-3">Eligibility Status</p>
                <EligibilityCheck ok={eligibility.batchCompleted} label="Batch Completed" />
                <EligibilityCheck ok={eligibility.feesCleared} label={`Fees Cleared${!eligibility.feesCleared ? ` (Due: ₹${eligibility.dueAmount})` : ''}`} />
                <EligibilityCheck ok={eligibility.attendanceOk} label={`Attendance ${eligibility.attendancePercentage}% (min 75%)`} />
                <div className={`mt-3 p-2 rounded text-sm font-medium text-center ${eligibility.eligible ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {eligibility.eligible ? 'Student is eligible for certificate' : 'Student is not eligible yet'}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!eligibility?.eligible || issueMutation.isPending} onClick={() => issueMutation.mutate(selectedEnrollmentId)}>
              Issue Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
