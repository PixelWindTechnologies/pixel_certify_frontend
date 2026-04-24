import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RiFilePdfLine, RiVideoLine, RiFileTextLine, RiLinkM, RiExternalLinkLine, RiBookOpenLine } from 'react-icons/ri'

interface Module { _id: string; title: string; description: string; resourceType: 'PDF' | 'VIDEO' | 'NOTE' | 'LINK'; url: string; course: { title: string }; uploadedBy: { username: string } }

const typeIcons = { PDF: <RiFilePdfLine className="text-red-500 text-xl" />, VIDEO: <RiVideoLine className="text-blue-500 text-xl" />, NOTE: <RiFileTextLine className="text-yellow-500 text-xl" />, LINK: <RiLinkM className="text-purple-500 text-xl" /> }
const typeColors = { PDF: 'danger', VIDEO: 'default', NOTE: 'warning', LINK: 'secondary' } as const

export default function StudentModulesPage() {
  const { data: modules = [], isLoading } = useQuery<Module[]>({ queryKey: ['student-modules'], queryFn: () => api.get('/student/modules').then(r => r.data) })

  // Group modules by course title to create distinct blocks
  // Defensive check: Ensure modules is an array to prevent "map/reduce is not a function" errors
  const safeModules = Array.isArray(modules) ? modules : [];

  const groupedModules = safeModules.reduce((acc, m) => {
    const courseTitle = m.course?.title || 'General Resources';
    if (!acc[courseTitle]) acc[courseTitle] = [];
    acc[courseTitle].push(m);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{safeModules.length} resource(s) available across your courses</p>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : safeModules.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No learning resources available yet.</CardContent></Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedModules).map(([courseTitle, courseModules]) => (
            <div key={courseTitle} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-muted pb-2">
                <RiBookOpenLine className="text-blue-600 text-xl" />
                <h2 className="text-lg font-bold tracking-tight">{courseTitle}</h2>
                <Badge variant="outline" className="ml-2 text-xs">{courseModules.length} Modules</Badge>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {courseModules.map(m => (
                  <Card key={m._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                          {typeIcons[m.resourceType]}
                        </div>
                        <Badge variant={typeColors[m.resourceType]}>{m.resourceType}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{m.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{m.description}</p>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                      >
                        <RiExternalLinkLine /> Open Resource
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
