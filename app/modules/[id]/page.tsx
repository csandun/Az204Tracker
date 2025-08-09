import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SectionCard } from '@/components/SectionCard'

type Section = { id: string; title: string; order: number }
type Module = { id: string; title: string; description: string | null }
type SectionRating = {
  section_id: string
  stars: number
}
type SectionProgress = {
  section_id: string
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
}
type ModuleProgress = {
  module_id: string
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
  current_section_id: string | null
  completed_sections: number
  total_sections: number
}

export default async function ModuleDetail({ params }: { params: { id: string } }) {
  const supabase = createClient()
  if (!supabase) {
    return (
      <main>
        <p className="text-red-400">Env missing. Add NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </main>
    )
  }

  const { data: module } = await supabase
    .from('modules')
    .select('id,title,description')
    .eq('id', params.id)
    .single()

  const { data: sections } = await supabase
    .from('module_sections')
    .select('id,title,order')
    .eq('module_id', params.id)
    .order('order', { ascending: true })

  // Get user progress and ratings data
  const {
    data: { user }
  } = await supabase.auth.getUser()

  let sectionRatings: SectionRating[] = []
  let sectionProgressData: SectionProgress[] = []
  let moduleProgress: ModuleProgress | null = null
  if (user) {
    const { data: ratings } = await supabase
      .from('ratings')
      .select('section_id, stars')
      .eq('user_id', user.id)
    sectionRatings = (ratings as SectionRating[]) || []

    // Get section-level progress
    const { data: sectionProgress } = await supabase
      .from('section_progress')
      .select('section_id, status')
      .eq('user_id', user.id)
    sectionProgressData = (sectionProgress as SectionProgress[]) || []

    // Get aggregated module progress
    const { data: progress } = await supabase
      .from('v_module_progress')
      .select('module_id, status, current_section_id, completed_sections, total_sections')
      .eq('user_id', user.id)
      .eq('module_id', params.id)
      .maybeSingle()
    moduleProgress = progress as ModuleProgress | null
  }

  const ratingsMap = new Map(sectionRatings.map((r: SectionRating) => [r.section_id, r.stars]))
  const sectionProgressMap = new Map(sectionProgressData.map((p: SectionProgress) => [p.section_id, p.status]))

  if (!module) {
    return (
      <main>
        <p className="text-gray-400">Module not found.</p>
      </main>
    )
  }

  // Module status colors and labels
  const moduleStatus = moduleProgress?.status || 'not_started'
  const statusColors: Record<string, string> = {
    'not_started': 'bg-gray-100 text-gray-600',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'done': 'bg-green-100 text-green-800',
    'skipped': 'bg-orange-100 text-orange-700'
  }
  const statusLabels: Record<string, string> = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'done': 'Completed',
    'skipped': 'Skipped'
  }

  return (
    <main className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Modules', href: '/modules' }, { label: module.title }]} />
      <div className="rounded-xl border border-gray-300 p-6 bg-white shadow-sm">
        <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-semibold tracking-tight">{module.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[moduleStatus]}`}>
            {statusLabels[moduleStatus]}
          </span>
          {moduleProgress && moduleProgress.total_sections > 0 && (
            <span className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
              {moduleProgress.completed_sections}/{moduleProgress.total_sections} sections
            </span>
          )}
        </div>
        {module.description && <p className="text-gray-700 mt-2 leading-relaxed">{module.description}</p>}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-primary/70" /> Sections</h2>
        <ul className="space-y-2">
          {(sections as Section[] | null)?.map((s) => {
            const rating = ratingsMap.get(s.id)
            const sectionStatus = sectionProgressMap.get(s.id) || 'not_started'
            const isCurrentSection = moduleProgress?.current_section_id === s.id
            
            return (
              <SectionCard
                key={s.id}
                section={s}
                status={sectionStatus}
                isCurrentSection={isCurrentSection}
                rating={rating}
              />
            )
          })}
          {(!sections || sections.length === 0) && (
            <li className="text-gray-700">No sections yet.</li>
          )}
        </ul>
      </section>
    </main>
  )
}
