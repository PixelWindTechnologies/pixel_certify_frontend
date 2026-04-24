import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiGraduationCapLine, RiSearchLine } from 'react-icons/ri'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Student {
  _id: string; studentId: string; fullName: string; email: string; phone: string
  course: { _id: string; title: string }; batch: { _id: string; title: string; startDate: string; endDate: string }
  totalFees: number; paidAmount: number; isActive: boolean; createdAt: string
  attendancePercentage?: number; userId?: { lastLogin?: string }; coursesEnrolled?: number
}
interface Course { _id: string; title: string }
interface Batch { _id: string; title: string; course: { _id: string; title: string } }

const emptyForm = { studentId: '', fullName: '', email: '', phone: '', course: '', batch: '', totalFees: '', temporaryPassword: '' }

export default function StudentsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [emailExists, setEmailExists] = useState(false)
  const [courseFilter, setCourseFilter] = useState('all')
  const [batchFilter, setBatchFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const { toast } = useToast()
  const qc = useQueryClient()

  // Debounce search input to improve performance and reduce API load
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const { data: students = [], isLoading } = useQuery<Student[]>({ 
    queryKey: ['students', debouncedSearch, courseFilter, batchFilter, dateFilter], 
    queryFn: () => api.get('/admin', { 
      params: { 
        search: debouncedSearch.trim() || undefined,
        course: courseFilter === 'all' ? undefined : courseFilter,
        batch: batchFilter === 'all' ? undefined : batchFilter,
        date: dateFilter || undefined,
      } 
    }).then(r => r.data) 
  })

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses').then(r => r.data) })
  const { data: batches = [] } = useQuery<Batch[]>({ queryKey: ['batches'], queryFn: () => api.get('/batches').then(r => r.data) })

  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@') || editing) {
      setEmailExists(false);
      return;
    }
    try {
      const res = await api.get(`/admin/check-email?email=${email}`)
      setEmailExists(res.data.exists)
      
      // If the student already exists, reset the temporary password field 
      // to ensure it is not allowed or sent during enrollment.
      if (res.data.exists) {
        setForm(f => ({ ...f, temporaryPassword: '', studentId: res.data.studentId || '' }))
      }
    } catch (err) {
      console.error('Email check failed', err)
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/admin', { ...data, totalFees: Number(data.totalFees) }),
    onSuccess: (res) => { 
      qc.invalidateQueries({ queryKey: ['students'] }); 
      toast({ title: res.data.message || 'Student created', variant: 'success' } as never); 
      setOpen(false); 
      setForm(emptyForm);
      setEmailExists(false);
    },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'; toast({ title: 'Error', description: msg, variant: 'destructive' }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.put(`/admin/${id}`, { ...data, totalFees: data.totalFees ? Number(data.totalFees) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast({ title: 'Student updated', variant: 'success' } as never); setOpen(false); setEditing(null); setEmailExists(false); },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed'; toast({ title: 'Error', description: msg, variant: 'destructive' }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast({ title: 'Student removed', variant: 'success' } as never) },
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setEmailExists(false); setOpen(true) }
  const openEdit = (s: Student) => {
    setEditing(s)
    setForm({ 
      studentId: s.studentId,
      fullName: s.fullName, 
      email: s.email, 
      phone: s.phone, 
      course: s.course?._id || '', 
      batch: s.batch?._id || '', 
      totalFees: String(s.totalFees || 0), 
      temporaryPassword: '' 
    })
    setEmailExists(true)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      toast({ 
        title: 'Invalid Phone Number', 
        description: 'Phone number must be 10 digits and start with 6, 7, 8, or 9.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (editing) {
      updateMutation.mutate({ id: editing._id, data })
    } else {
      if (emailExists) data.temporaryPassword = ''
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative w-64">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, ID or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Course</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Batch</Label>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Batch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map(b => <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Joined On</Label>
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-40" />
          </div>
          {(search || courseFilter !== 'all' || batchFilter !== 'all' || dateFilter !== '') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCourseFilter('all'); setBatchFilter('all'); setDateFilter('') }}>Reset</Button>
          )}
        </div>
        <Button onClick={openCreate}><RiAddLine className="mr-2" /> Add Student</Button>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : students.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No students found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {students.map(s => (
            <Card key={s._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <RiGraduationCapLine className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{s.fullName}</p>
                        <Badge variant="outline" className="text-xs">{s.studentId}</Badge>
                        {s.coursesEnrolled && s.coursesEnrolled > 1 && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px]">{s.coursesEnrolled} Courses</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{s.email} · {s.phone}</p>
                      <p className="text-xs text-muted-foreground">{s.course?.title} · {s.batch?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right px-4 border-r border-l">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Attendance</p>
                      <p className={`text-lg font-bold ${(s.attendancePercentage || 0) < 75 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {s.attendancePercentage || 0}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(s.paidAmount)} / {formatCurrency(s.totalFees)}</p>
                      <p className="text-xs text-muted-foreground">Due: {formatCurrency(s.totalFees - s.paidAmount)}</p>
                      {s.userId?.lastLogin && (
                        <p className="text-[10px] text-blue-500 font-medium mt-0.5">Last Active: {formatDate(s.userId.lastLogin)}</p>
                      )}
                    </div>
                    <Badge variant={s.totalFees - s.paidAmount === 0 ? 'success' : 'warning'}>
                      {s.totalFees - s.paidAmount === 0 ? 'Fees Cleared' : 'Fees Pending'}
                    </Badge>
                    <p className="text-xs text-muted-foreground hidden md:block">Joined {formatDate(s.createdAt)}</p>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}><RiEditLine /></Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteMutation.mutate(s._id)}><RiDeleteBinLine /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription className="sr-only">Student information form</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input 
                  required 
                  value={form.studentId} 
                  onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} 
                  disabled={!!editing || emailExists}
                  placeholder="e.g. PW-2024-001"
                  className={emailExists ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  required 
                  type="email" 
                  value={form.email} 
                  onChange={e => {
                    setForm(f => ({ ...f, email: e.target.value }));
                  }}
                  onBlur={e => checkEmail(e.target.value)}
                />
                {emailExists && !editing && (
                  <p className="text-xs text-blue-600 font-semibold italic animate-pulse">Student already exists. They will be enrolled in the selected course.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, ''); // Keep only numbers
                    if (val.length <= 10) setForm(f => ({ ...f, phone: val }));
                  }}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Fees (INR)</Label>
                <Input required type="number" value={form.totalFees} onChange={e => setForm(f => ({ ...f, totalFees: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course} onValueChange={v => setForm(f => ({ ...f, course: v, batch: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={form.batch} onValueChange={v => setForm(f => ({ ...f, batch: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {batches
                      .filter(b => !form.course || b.course?._id === form.course)
                      .map(b => (
                        <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              {!editing && !emailExists && (
                <div className="space-y-2 col-span-2">
                  <Label>Temporary Password</Label>
                  <Input required value={form.temporaryPassword} onChange={e => setForm(f => ({ ...f, temporaryPassword: e.target.value }))} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update Student' : 'Create Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
