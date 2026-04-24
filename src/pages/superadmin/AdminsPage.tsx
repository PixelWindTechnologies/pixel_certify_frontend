import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiShieldUserLine } from 'react-icons/ri'
import { formatDate } from '@/lib/utils'

interface Admin {
  _id: string
  fullName: string
  email: string
  phone?: string
  employeeId: string
  isActive: boolean
  createdAt: string
  userId: { isFirstLogin: boolean }
}

export default function AdminsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Admin | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', temporaryPassword: '' })
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: admins = [], isLoading } = useQuery<Admin[]>({
    queryKey: ['admins'],
    queryFn: () => api.get('/super-admin/admins').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/super-admin/admins', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admins'] })
      toast({ title: 'Admin created', variant: 'success' } as never)
      setOpen(false)
      setForm({ fullName: '', email: '', phone: '', temporaryPassword: '' })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.put(`/super-admin/admins/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admins'] })
      toast({ title: 'Admin updated', variant: 'success' } as never)
      setOpen(false); setEditing(null)
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update admin'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/super-admin/admins/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admins'] })
      toast({ title: 'Admin removed', variant: 'success' } as never)
    },
  })

  const openCreate = () => { setEditing(null); setForm({ fullName: '', email: '', phone: '', temporaryPassword: '' }); setOpen(true) }
  const openEdit = (a: Admin) => { setEditing(a); setForm({ fullName: a.fullName, email: a.email, phone: a.phone || '', temporaryPassword: '' }); setOpen(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      toast({ 
        title: 'Invalid Phone Number', 
        description: 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.', 
        variant: 'destructive' 
      });
      return;
    }

    // Normalize data before sending to prevent common backend validation/conflict issues
    const payload = { ...form, email: form.email.toLowerCase().trim() };

    if (editing) {
      // Avoid sending an empty password string during update as it may trigger server-side validation errors
      const { temporaryPassword, ...updateData } = payload;
      const finalUpdateData = temporaryPassword.trim() ? payload : updateData;
      updateMutation.mutate({ id: editing._id, data: finalUpdateData })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{admins.length} admin(s) registered</p>
        <Button onClick={openCreate}><RiAddLine className="mr-2" /> Add Admin</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : admins.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No admins found. Create the first one.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {admins.map(admin => (
            <Card key={admin._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <RiShieldUserLine className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{admin.fullName}</p>
                      <p className="text-sm text-muted-foreground">{admin.email} · {admin.employeeId}</p>
                      {admin.phone && <p className="text-xs text-muted-foreground">{admin.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={admin.isActive ? 'success' : 'danger'}>{admin.isActive ? 'Active' : 'Inactive'}</Badge>
                    {admin.userId?.isFirstLogin && <Badge variant="warning">First Login Pending</Badge>}
                    <p className="text-xs text-muted-foreground">Joined {formatDate(admin.createdAt)}</p>
                    <Button size="sm" variant="outline" onClick={() => openEdit(admin)}><RiEditLine /></Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteMutation.mutate(admin._id)}><RiDeleteBinLine /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Admin' : 'Create New Admin'}</DialogTitle>
            <DialogDescription>
              Fill in the details for the administrator account. The phone number must be exactly 10 digits starting with 6, 7, 8, or 9.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
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
              {!editing && (
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <Input required type="text" value={form.temporaryPassword} onChange={e => setForm(f => ({ ...f, temporaryPassword: e.target.value }))} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Create Admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
