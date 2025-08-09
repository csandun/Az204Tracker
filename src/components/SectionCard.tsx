"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Section = { 
  id: string; 
  title: string; 
  order: number 
}

type SectionCardProps = {
  section: Section
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
  isCurrentSection: boolean
  rating?: number
}

export function SectionCard({ section, status, isCurrentSection, rating }: SectionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const sectionStatusColors: Record<string, string> = {
    'not_started': 'bg-gray-100 text-gray-600',
    'in_progress': 'bg-yellow-100 text-yellow-800', 
    'done': 'bg-green-100 text-green-800',
    'skipped': 'bg-orange-100 text-orange-700'
  }
  
  const sectionStatusLabels: Record<string, string> = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'done': 'Completed', 
    'skipped': 'Skipped'
  }

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/sections/${section.id}`)
  }

  return (
    <li className={`group relative rounded-lg border p-3 bg-white flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 ${isCurrentSection ? 'border-primary/40 bg-primary/5' : 'border-gray-300'}`}>
      <div className="flex items-center gap-3">
        <div className="text-gray-900 group-hover:text-primary font-medium">{section.title}</div>
        {isCurrentSection && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary text-white font-medium">
            Current
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sectionStatusColors[status]}`}>
          {sectionStatusLabels[status]}
        </span>
        {rating && (
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({rating}/5)</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">#{section.order}</span>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-xs text-gray-600 font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      <button 
        onClick={handleClick}
        disabled={isLoading}
        aria-label={`Open ${section.title}`} 
        className="absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed"
      />
    </li>
  )
}
