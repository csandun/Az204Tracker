import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/StarRating'
// import { NotesEditor } from '@/components/NotesEditor'
// import { UploadImage } from '@/components/UploadImage'
import { ProgressControls } from '@/components/ProgressControls'
import { ShortNotes } from '@/components/ShortNotes'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ResourcesPanel } from './ResourcesPanel'

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
}

export default async function SectionDetail({ params }: { params: { id: string } }) {
  const supabase = createClient()
  if (!supabase) {
    return <main><p className="text-red-400">Env missing. Add NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></main>
  }

  const { data: section } = await supabase
    .from('module_sections')
    .select('id,title,module_id')
    .eq('id', params.id)
    .single()

  if (!section) {
    return <main><p className="text-gray-400">Section not found.</p></main>
  }

  const { data: module } = await supabase
    .from('modules')
    .select('id,title')
    .eq('id', section.module_id)
    .single()

  // Get user progress and rating data
  const {
    data: { user }
  } = await supabase.auth.getUser()

  let sectionRating: SectionRating | null = null
  let sectionProgress: SectionProgress | null = null
  let moduleProgress: ModuleProgress | null = null
  if (user) {
    const { data: rating } = await supabase
      .from('ratings')
      .select('section_id, stars')
      .eq('user_id', user.id)
      .eq('section_id', params.id)
      .maybeSingle()
    sectionRating = rating as SectionRating | null

    // Get section-level progress
    const { data: sectionProg } = await supabase
      .from('section_progress')
      .select('section_id, status')
      .eq('user_id', user.id)
      .eq('section_id', params.id)
      .maybeSingle()
    sectionProgress = sectionProg as SectionProgress | null

    // Get module progress for context
    const { data: progress } = await supabase
      .from('v_module_progress_corrected')
      .select('module_id, status, current_section_id')
      .eq('user_id', user.id)
      .eq('module_id', section.module_id)
      .maybeSingle()
    moduleProgress = progress as ModuleProgress | null
  }

  const isCurrentSection = moduleProgress?.current_section_id === section.id
  const moduleStatus = moduleProgress?.status || 'not_started'
  const sectionStatus = sectionProgress?.status || 'not_started'
  
  // Status colors and labels
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

  // Resources are managed client-side via ResourcesPanel

  return (
    <main className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Modules', href: '/modules' }, ...(module ? [{ label: module.title, href: `/modules/${module.id}` }] : []), { label: section.title }]} />
      <div className="rounded-xl border border-gray-300 p-6 bg-white shadow-sm">
        <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{section.title}</h1>
            {module && <p className="text-gray-700 mt-1">in {module.title}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {isCurrentSection && (
              <span className="text-sm px-3 py-1 rounded-full bg-primary text-white font-medium">
                Current Section
              </span>
            )}
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[sectionStatus]}`}>
              Section: {statusLabels[sectionStatus]}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[moduleStatus]}`}>
              Module: {statusLabels[moduleStatus]}
            </span>
            {sectionRating && (
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-sm ${star <= sectionRating.stars ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-600">({sectionRating.stars}/5)</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <StarRating sectionId={section.id} />
          <ProgressControls moduleId={section.module_id} sectionId={section.id} />
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-primary/70" /> Resources</h2>
        <ResourcesPanel moduleId={section.module_id} sectionId={section.id} />
      </section>

      {/* Notes temporarily hidden */}

      <section>
        <ShortNotes sectionId={section.id} />
      </section>
    </main>
  )
}
