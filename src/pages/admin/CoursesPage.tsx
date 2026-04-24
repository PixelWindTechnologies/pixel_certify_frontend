import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiBookOpenLine } from 'react-icons/ri'
import { formatCurrency } from '@/lib/utils'

interface Course { _id: string; title: string; description: string; duration: string; fees: number; isActive: boolean }
const emptyForm = { title: '', description: '', duration: '', fees: '' }

export default function CoursesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: courses = [], isLoading } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/courses', { ...d, fees: Number(d.fees) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast({ title: 'Course created', variant: 'success' } as never); setOpen(false); setForm(emptyForm) },
    onError: () => toast({ title: 'Error', description: 'Failed to create course', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: typeof form }) => api.put(`/courses/${id}`, { ...d, fees: Number(d.fees) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast({ title: 'Course updated', variant: 'success' } as never); setOpen(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast({ title: 'Course removed', variant: 'success' } as never) },
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }
  const openEdit = (c: Course) => { setEditing(c); setForm({ title: c.title, description: c.description, duration: c.duration, fees: String(c.fees) }); setOpen(true) }
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); editing ? updateMutation.mutate({ id: editing._id, d: form }) : createMutation.mutate(form) }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><RiAddLine className="mr-2" /> Add Course</Button>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : courses.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No courses yet.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => (
            <Card key={c._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <RiBookOpenLine className="text-blue-600 text-lg" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><RiEditLine /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(c._id)}><RiDeleteBinLine /></Button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration: {c.duration}</span>
                  <span className="font-medium text-blue-600">{formatCurrency(c.fees)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Course' : 'New Course'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duration</Label><Input required placeholder="e.g. 3 months" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Fees (INR)</Label><Input required type="number" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} /></div>
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
