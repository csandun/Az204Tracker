import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Module {
  id: string
  title: string
  sort_order: number
  sections_count: number
}

interface ModuleProgress {
  module_id: string
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
  current_section_id: string | null
  last_visit: string
  completed_sections: number
  total_sections: number
}

interface SectionRating {
  section_id: string
  stars: number
}

interface DashboardStats {
  totalModules: number
  completedModules: number
  inProgressModules: number
  totalSections: number
  completedSections: number
  overallProgress: number
}

export default async function DashboardPage() {
  const supabase = createClient()
  if (!supabase) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-red-400">Environment not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.</p>
      </main>
    )
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
          <p className="text-gray-800">You are not signed in.</p>
          <p className="text-sm text-gray-600 mt-2">Sign in to view your progress summary.</p>
        </div>
      </main>
    )
  }

  // Fetch modules and progress data
  const { data: modules } = await supabase
    .from('v_modules_overview')
    .select('id, title, sort_order, sections_count')
    .order('sort_order')

  const { data: progressData } = await supabase
    .from('v_module_progress')
    .select('module_id, status, current_section_id, last_visit, completed_sections, total_sections')
    .eq('user_id', user.id)

  const { data: overallProgressData } = await supabase
    .from('v_overall_progress_corrected')
    .select('total_sections, completed_sections, in_progress_sections, progress_percentage')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: sectionRatings } = await supabase
    .from('ratings')
    .select('section_id, stars')
    .eq('user_id', user.id)

  const modulesList = (modules as Module[]) || []
  const progressList = (progressData as ModuleProgress[]) || []
  const ratingsList = (sectionRatings as SectionRating[]) || []
  const overallProgress = overallProgressData || { total_sections: 0, completed_sections: 0, in_progress_sections: 0, progress_percentage: 0 }

  // Calculate dashboard statistics
  const stats: DashboardStats = {
    totalModules: modulesList.length,
    completedModules: progressList.filter((p: ModuleProgress) => p.status === 'done').length,
    inProgressModules: progressList.filter((p: ModuleProgress) => p.status === 'in_progress').length,
    totalSections: overallProgress.total_sections,
    completedSections: overallProgress.completed_sections,
    overallProgress: Math.round(overallProgress.progress_percentage)
  }

  // Find current/next module
  const progressMap = new Map(progressList.map((p: ModuleProgress) => [p.module_id, p]))
  const currentModule = modulesList.find((m: Module) => {
    const progress = progressMap.get(m.id) as ModuleProgress | undefined
    return progress?.status === 'in_progress'
  })
  
  const nextModule = modulesList.find((m: Module) => {
    const progress = progressMap.get(m.id) as ModuleProgress | undefined
    return !progress || progress.status === 'not_started'
  })

  // Recent activity (last visited modules)
  const recentActivity = progressList
    .filter((p: ModuleProgress) => p.last_visit)
    .sort((a: ModuleProgress, b: ModuleProgress) => new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime())
    .slice(0, 3)
    .map((p: ModuleProgress) => {
      const module = modulesList.find((m: Module) => m.id === p.module_id)
      return { ...p, moduleTitle: module?.title || 'Unknown Module' }
    })

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <Link 
          href="/modules"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          View All Modules
        </Link>
      </div>

      {/* Welcome Section */}
      <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
        <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome back, {user.email?.split('@')[0]}</h2>
        <p className="text-gray-600">Track your AZ-204 study progress and continue learning.</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="h-1.5 w-8 bg-green-500 rounded-full mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.overallProgress}%</div>
          <div className="text-sm text-gray-600">Overall Progress</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="h-1.5 w-8 bg-blue-500 rounded-full mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.completedModules}/{stats.totalModules}</div>
          <div className="text-sm text-gray-600">Modules Completed</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="h-1.5 w-8 bg-yellow-500 rounded-full mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.inProgressModules}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="h-1.5 w-8 bg-purple-500 rounded-full mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.completedSections}/{stats.totalSections}</div>
          <div className="text-sm text-gray-600">Sections Completed</div>
        </div>
      </div>

      {/* Current/Next Module */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentModule && (
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
            <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Continue Learning</h3>
            <p className="text-gray-600 mb-4">Pick up where you left off</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="font-medium text-gray-900">{currentModule.title}</div>
              <div className="text-sm text-gray-600">{currentModule.sections_count} sections</div>
            </div>
            <Link 
              href={`/modules/${currentModule.id}`}
              className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Continue Module
            </Link>
          </div>
        )}

        {nextModule && (
          <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
            <div className="h-1.5 w-12 bg-green-500 rounded-full mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Up Next</h3>
            <p className="text-gray-600 mb-4">Ready to start your next module</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="font-medium text-gray-900">{nextModule.title}</div>
              <div className="text-sm text-gray-600">{nextModule.sections_count} sections</div>
            </div>
            <Link 
              href={`/modules/${nextModule.id}`}
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Start Module
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
          <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{activity.moduleTitle}</div>
                  <div className="text-sm text-gray-600">
                    Status: <span className="capitalize">{activity.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.last_visit).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
        <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link 
            href="/modules"
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-900">All Modules</span>
            <span className="text-sm text-gray-600">{stats.totalModules}</span>
          </Link>
          
          {modulesList.slice(0, 5).map((module: Module) => {
            const progress = progressMap.get(module.id) as ModuleProgress | undefined
            const statusColor = progress?.status === 'done' ? 'bg-green-100 text-green-800' 
              : progress?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600'
            
            return (
              <Link 
                key={module.id}
                href={`/modules/${module.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900 truncate">{module.title}</span>
                <div className="flex items-center gap-2">
                  {progress && (
                    <span className="text-xs text-gray-500">
                      {progress.completed_sections}/{progress.total_sections}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                    {progress?.status?.replace('_', ' ') || 'not started'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
