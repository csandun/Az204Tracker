"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Module = { 
  id: string; 
  title: string; 
  order: number; 
  description: string | null 
}

type ModuleCardProps = {
  module: Module
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
}

export function ModuleCard({ module, status }: ModuleCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/modules/${module.id}`)
  }

  return (
    <li className="group relative rounded-xl border border-gray-300 p-4 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-gray-900 group-hover:text-primary">{module.title}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>
          {module.description && <p className="text-sm text-gray-600 line-clamp-2">{module.description}</p>}
        </div>
        <span className="text-xs text-gray-500 ml-2">#{module.order}</span>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-600 font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      <button 
        onClick={handleClick}
        disabled={isLoading}
        aria-label={`Open ${module.title}`} 
        className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed"
      />
    </li>
  )
}
