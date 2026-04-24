import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color?: string
  sub?: string
}

export default function StatCard({ title, value, icon, color = 'bg-blue-600', sub }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-white text-xl', color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
