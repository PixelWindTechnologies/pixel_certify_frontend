import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { RiBellLine, RiCheckLine } from 'react-icons/ri'
import { formatDateTime } from '@/lib/utils'

interface Notification { _id: string; title: string; message: string; targetType: 'ALL' | 'INDIVIDUAL'; sentByName: string; createdAt: string; readBy: string[] }

export default function StudentNotificationsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({ queryKey: ['student-notifications'], queryFn: () => api.get('/student/notifications').then(r => r.data) })

  const readMutation = useMutation({
    mutationFn: (id: string) => api.post(`/student/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-notifications'] }),
  })

  const isRead = (n: Notification) => n.readBy?.includes(user?.id || '')

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{notifications.length} notification(s)</p>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : notifications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No notifications yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {notifications.map(n => (
            <Card key={n._id} className={!isRead(n) ? 'border-blue-300 dark:border-blue-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isRead(n) ? 'bg-muted' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      <RiBellLine className={isRead(n) ? 'text-muted-foreground' : 'text-blue-600'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{n.title}</p>
                        {!isRead(n) && <Badge variant="default" className="text-xs">New</Badge>}
                        <Badge variant="secondary" className="text-xs">{n.targetType === 'ALL' ? 'Everyone' : 'You'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">From: {n.sentByName} · {formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                  {!isRead(n) && (
                    <Button size="sm" variant="ghost" onClick={() => readMutation.mutate(n._id)} title="Mark as read">
                      <RiCheckLine className="text-emerald-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
