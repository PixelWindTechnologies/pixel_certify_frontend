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
import { RiAddLine, RiDeleteBinLine, RiFilePdfLine, RiVideoLine, RiFileTextLine, RiLinkM, RiExternalLinkLine } from 'react-icons/ri'

interface Module { _id: string; title: string; description: string; resourceType: 'PDF' | 'VIDEO' | 'NOTE' | 'LINK'; url: string; course: { _id: string; title: string }; uploadedBy: { username: string } }
interface Course { _id: string; title: string }
const emptyForm = { title: '', description: '', resourceType: 'LINK', url: '', course: '' }

const typeIcons = { PDF: <RiFilePdfLine className="text-red-500" />, VIDEO: <RiVideoLine className="text-blue-500" />, NOTE: <RiFileTextLine className="text-yellow-500" />, LINK: <RiLinkM className="text-purple-500" /> }
const typeColors = { PDF: 'danger', VIDEO: 'default', NOTE: 'warning', LINK: 'secondary' } as const

export default function ModulesPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: modules = [], isLoading } = useQuery<Module[]>({ queryKey: ['modules'], queryFn: () => api.get('/modules').then(r => r.data) })
  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses').then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/modules', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules'] }); toast({ title: 'Module added', variant: 'success' } as never); setOpen(false); setForm(emptyForm) },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/modules/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['modules'] }); toast({ title: 'Module removed', variant: 'success' } as never) },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><RiAddLine className="mr-2" /> Add Module</Button>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : modules.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No modules added yet.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map(m => (
            <Card key={m._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xl">
                    {typeIcons[m.resourceType]}
                  </div>
                  <div className="flex gap-1 items-center">
                    <Badge variant={typeColors[m.resourceType]}>{m.resourceType}</Badge>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(m._id)}><RiDeleteBinLine /></Button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{m.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{m.description}</p>
                <p className="text-xs text-muted-foreground mb-3">{m.course?.title}</p>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <RiExternalLinkLine /> Open Resource
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Learning Module</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.resourceType} onValueChange={v => setForm(f => ({ ...f, resourceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="LINK">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course} onValueChange={v => setForm(f => ({ ...f, course: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>URL / Link</Label><Input required type="url" placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Add Module</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
