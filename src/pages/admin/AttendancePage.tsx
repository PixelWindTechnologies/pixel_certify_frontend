import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { RiCalendarCheckLine, RiUserLine, RiSave3Line } from 'react-icons/ri'
import { formatDate } from '@/lib/utils'

interface AttRecord {
  _id: string; studentId: string; attendanceDate: string; status: 'PRESENT' | 'ABSENT' | 'LATE'
  markedByUsername: string; markedByEmployeeId: string; markedByRole: string; markedAt: string
  student: { _id: string; fullName: string; studentId: string }; batch: { title: string }
}
interface Student { 
  _id: string; 
  studentId: string; 
  fullName: string; 
  batch: { _id: string; title: string };
  course: { _id: string; title: string };
}
interface Batch { _id: string; title: string; course: { _id: string; title: string } }

export default function AttendancePage() {
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({})
  
  const { toast } = useToast()
  const qc = useQueryClient()

  // Fetch batches for filter
  const { data: batches = [] } = useQuery<Batch[]>({ queryKey: ['batches'], queryFn: () => api.get('/batches').then(r => r.data) })

  // Fetch students for the selected batch
  const { data: students = [], isLoading: loadingStudents } = useQuery<Student[]>({ 
    queryKey: ['batch-students', selectedBatch], 
    queryFn: () => api.get('/admin', { params: { batch: selectedBatch } }).then(r => r.data),
    enabled: !!selectedBatch
  })

  // Fetch existing attendance records for the selected batch and date
  const { data: records = [], isLoading } = useQuery<AttRecord[]>({ 
    queryKey: ['attendance', attendanceDate, selectedBatch], 
    queryFn: () => api.get('/attendance', { 
      params: { 
        date: attendanceDate,
        batch: selectedBatch
      } 
    }).then(r => r.data),
    enabled: !!selectedBatch
  })

  // Sync existing records to state map
  useEffect(() => {
    const map: Record<string, string> = {}
    // Default all students to PRESENT
    students.forEach(s => map[s._id] = 'PRESENT')
    // Override with existing database records
    records.forEach(r => {
      if (r.student) map[r.student._id] = r.status
    })
    setAttendanceMap(map)
  }, [records, students])

  const bulkMarkMutation = useMutation({
    mutationFn: (data: any) => api.post('/attendance/bulk', data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast({ title: 'Batch attendance saved successfully', variant: 'success' } as never) 
    },
    onError: () => toast({ title: 'Error', description: 'Failed to save attendance', variant: 'destructive' }),
  })

  const handleSave = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (attendanceDate > todayStr) {
      toast({ 
        title: 'Invalid Date', 
        description: 'Cannot mark attendance for future dates.', 
        variant: 'destructive' 
      });
      return;
    }

    const formattedRecords = students.map(s => ({
      studentObjectId: s._id,
      studentId: s.studentId,
      status: attendanceMap[s._id] || 'PRESENT'
    }))
    bulkMarkMutation.mutate({ batchId: selectedBatch, date: attendanceDate, records: formattedRecords })
  }

  const presentCount = Object.values(attendanceMap).filter(v => v === 'PRESENT' || v === 'LATE').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'ABSENT').length;
  const totalInBatch = students.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 justify-between items-end bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Select Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-64 h-9"><SelectValue placeholder="Choose a batch" /></SelectTrigger>
              <SelectContent>
                {batches.map(b => <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Date</Label>
            <Input 
              type="date" 
              value={attendanceDate} 
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setAttendanceDate(e.target.value)} 
              className="w-40 h-9" 
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={!selectedBatch || bulkMarkMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
          <RiSave3Line className="mr-2" /> Save Batch Attendance
        </Button>
      </div>

      {selectedBatch && students.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="bg-emerald-50 border-emerald-100"><CardContent className="p-3 text-center"><p className="text-sm text-emerald-600 font-medium">Present</p><p className="text-xl font-bold text-emerald-700">{presentCount}</p></CardContent></Card>
          <Card className="bg-red-50 border-red-100"><CardContent className="p-3 text-center"><p className="text-sm text-red-600 font-medium">Absent</p><p className="text-xl font-bold text-red-700">{absentCount}</p></CardContent></Card>
          <Card className="bg-blue-50 border-blue-100"><CardContent className="p-3 text-center"><p className="text-sm text-blue-600 font-medium">Total Students</p><p className="text-xl font-bold text-blue-700">{totalInBatch}</p></CardContent></Card>
        </div>
      )}

      {!selectedBatch ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center text-muted-foreground">
            <RiCalendarCheckLine size={48} className="mx-auto mb-4 opacity-20" />
            <p>Please select a batch and date to manage attendance.</p>
          </CardContent>
        </Card>
      ) : loadingStudents ? (
        <p className="text-sm text-muted-foreground">Loading student list...</p>
      ) : students.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground italic">No students found in this batch.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {students.map(s => (
            <Card key={s._id} className={attendanceMap[s._id] === 'ABSENT' ? 'border-red-200 bg-red-50/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <RiUserLine className="text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">{s.fullName} <span className="text-muted-foreground font-normal text-xs ml-1">({s.studentId})</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {[
                      { val: 'PRESENT', label: 'Present', color: 'text-emerald-600', accent: 'accent-emerald-600' },
                      { val: 'ABSENT', label: 'Absent', color: 'text-red-600', accent: 'accent-red-600' },
                      { val: 'LATE', label: 'Late', color: 'text-orange-600', accent: 'accent-orange-600' }
                    ].map((opt) => (
                      <div key={opt.val} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`${opt.val}-${s._id}`}
                          name={`attendance-${s._id}`}
                          value={opt.val}
                          checked={(attendanceMap[s._id] || 'PRESENT') === opt.val}
                          onChange={() => setAttendanceMap(prev => ({ ...prev, [s._id]: opt.val }))}
                          className={`h-4 w-4 border-gray-300 cursor-pointer ${opt.accent}`}
                        />
                        <Label htmlFor={`${opt.val}-${s._id}`} className={`text-[10px] font-bold cursor-pointer uppercase tracking-tight ${opt.color}`}>
                          {opt.label}
                        </Label>
                      </div>
                    ))}
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
