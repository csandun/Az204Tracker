import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ModuleCard } from '@/components/ModuleCard'
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
          return (
            <ModuleCard 
              key={m.id} 
              module={m} 
              status={status} 
            />
          )
        })}
      </ul>
    </main>
  )
}
