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
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiCalendarLine } from 'react-icons/ri'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Batch { _id: string; title: string; description: string; course: { _id: string; title: string }; startDate: string; endDate: string; fees: number }
interface Course { _id: string; title: string }
const emptyForm = { title: '', description: '', course: '', startDate: '', endDate: '', fees: '' }

export default function BatchesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: batches = [], isLoading } = useQuery<Batch[]>({ queryKey: ['batches'], queryFn: () => api.get('/batches').then(r => r.data) })
  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/batches', { ...d, fees: Number(d.fees) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast({ title: 'Batch created', variant: 'success' } as never); setOpen(false); setForm(emptyForm) },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: typeof form }) => api.put(`/batches/${id}`, { ...d, fees: Number(d.fees) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast({ title: 'Batch updated', variant: 'success' } as never); setOpen(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/batches/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); toast({ title: 'Batch removed', variant: 'success' } as never) },
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (b: Batch) => {
    setEditing(b)
    setForm({ title: b.title, description: b.description, course: b.course._id, startDate: b.startDate.slice(0, 10), endDate: b.endDate.slice(0, 10), fees: String(b.fees) })
    setOpen(true)
  }
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast({ 
        title: 'Invalid Dates', 
        description: 'End date cannot be earlier than the start date.', 
        variant: 'destructive' 
      });
      return;
    }
    editing ? updateMutation.mutate({ id: editing._id, d: form }) : createMutation.mutate(form) 
  }

  const isCompleted = (endDate: string) => new Date() >= new Date(endDate)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><RiAddLine className="mr-2" /> Add Batch</Button>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : batches.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No batches yet.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map(b => (
            <Card key={b._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <RiCalendarLine className="text-purple-600 text-lg" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><RiEditLine /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(b._id)}><RiDeleteBinLine /></Button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground mb-1">{b.course?.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{b.description}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Start:</span><span>{formatDate(b.startDate)}</span></div>
                  <div className="flex justify-between"><span>End:</span><span>{formatDate(b.endDate)}</span></div>
                  <div className="flex justify-between"><span>Fees:</span><span className="font-medium text-foreground">{formatCurrency(b.fees)}</span></div>
                </div>
                <div className="mt-3">
                  <Badge variant={isCompleted(b.endDate) ? 'success' : 'warning'}>
                    {isCompleted(b.endDate) ? 'Completed' : 'Ongoing'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Batch' : 'New Batch'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Batch Title</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={form.course} onValueChange={v => setForm(f => ({ ...f, course: v }))}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input required type="date" min={form.startDate} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              <div className="space-y-2 col-span-2"><Label>Fees (INR)</Label><Input required type="number" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
