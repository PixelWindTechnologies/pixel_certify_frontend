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
import { RiAddLine, RiBellLine, RiDeleteBinLine, RiGroupLine, RiUserLine } from 'react-icons/ri'
import { formatDateTime } from '@/lib/utils'

interface Notification { _id: string; title: string; message: string; targetType: 'ALL' | 'INDIVIDUAL'; targetStudentId?: string; sentByName: string; createdAt: string }
interface Student { studentId: string; fullName: string }
const emptyForm = { title: '', message: '', targetType: 'ALL', targetStudentId: '' }

export default function NotificationsPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({ queryKey: ['notifications-admin'], queryFn: () => api.get('/notifications').then(r => r.data) })
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => api.get('/admin').then(r => r.data) })

  const sendMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/notifications', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications-admin'] }); toast({ title: 'Notification sent', variant: 'success' } as never); setOpen(false); setForm(emptyForm) },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications-admin'] }); toast({ title: 'Deleted', variant: 'success' } as never) },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><RiAddLine className="mr-2" /> Send Notification</Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : notifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No notifications sent yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {notifications.map(n => (
            <Card key={n._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <RiBellLine className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{n.title}</p>
                        <Badge variant={n.targetType === 'ALL' ? 'default' : 'secondary'}>
                          {n.targetType === 'ALL' ? <><RiGroupLine className="mr-1" /> All Students</> : <><RiUserLine className="mr-1" /> {n.targetStudentId}</>}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">Sent by {n.sentByName} · {formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive flex-shrink-0" onClick={() => deleteMutation.mutate(n._id)}><RiDeleteBinLine /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); sendMutation.mutate(form) }} className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Message</Label><Input required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Send To</Label>
              <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v, targetStudentId: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Students</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetType === 'INDIVIDUAL' && (
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={form.targetStudentId} onValueChange={v => setForm(f => ({ ...f, targetStudentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.studentId} value={s.studentId}>{s.fullName} ({s.studentId})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={sendMutation.isPending}>Send</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
