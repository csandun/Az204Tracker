import { Breadcrumbs } from '@/components/Breadcrumbs'
import { createClient } from '@/lib/supabase/server'

type Module = { id: string; title: string; order: number; description: string | null }
type ProgressData = {
  module_id: string
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
}

export default async function ModulesPage() {
  const supabase = createClient()
  if (!supabase) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">Modules</h1>
        <p className="text-red-400">Environment not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.</p>
      </main>
    )
  }

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('order', { ascending: true })

  // Get user progress data
  const {
    data: { user }
  } = await supabase.auth.getUser()

  let progressData: ProgressData[] = []
  if (user) {
    const { data: progress } = await supabase
      .from('v_module_progress')
      .select('module_id, status')
      .eq('user_id', user.id)
    progressData = (progress as ProgressData[]) || []
  }

  const progressMap = new Map(progressData.map((p: ProgressData) => [p.module_id, p.status]))

  return (
    <main className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Modules' }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Modules</h1>
      {(!modules || modules.length === 0) && (
        <p className="text-gray-600">
          No modules yet. Apply the SQL in <code className="text-gray-700">supabase/migrations/0001_init.sql</code>
          and optionally seed sample modules. Then refresh.
        </p>
      )}
      <ul className="grid sm:grid-cols-2 gap-4">
        {modules?.map((m: Module) => {
          const status = progressMap.get(m.id) || 'not_started'
          const statusColors = {
            'not_started': 'bg-gray-100 text-gray-600',
            'in_progress': 'bg-yellow-100 text-yellow-800',
            'done': 'bg-green-100 text-green-800',
            'skipped': 'bg-orange-100 text-orange-700'
          }
          const statusLabels = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'done': 'Completed',
            'skipped': 'Skipped'
          }

          return (
            <li key={m.id} className="group relative rounded-xl border border-gray-300 p-4 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold text-gray-900 group-hover:text-primary">{m.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status]}`}>
                      {statusLabels[status]}
                    </span>
                  </div>
                  {m.description && <p className="text-sm text-gray-600 line-clamp-2">{m.description}</p>}
                </div>
                <span className="text-xs text-gray-500 ml-2">#{m.order}</span>
              </div>
              <a href={`/modules/${m.id}`} aria-label={`Open ${m.title}`} className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
            </li>
          )
        })}
      </ul>
    </main>
  )
}
