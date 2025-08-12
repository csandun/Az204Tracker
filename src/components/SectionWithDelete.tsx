'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SectionWithDeleteProps {
  section: {
    id: string
    title: string
    order: number
  }
  status: 'not_started' | 'in_progress' | 'done' | 'skipped'
  isCurrentSection: boolean
  rating?: number
  isAuthenticated: boolean
  onDelete: (sectionId: string) => void
}

export function SectionWithDelete({ 
  section, 
  status, 
  isCurrentSection, 
  rating,
  isAuthenticated,
  onDelete
}: SectionWithDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()

    if (!confirm(`Are you sure you want to delete "${section.title}"? This will permanently delete all associated data and cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/sections?id=${section.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete(section.id)
      } else {
        const { error } = await response.json()
        alert(`Error deleting section: ${error}`)
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Failed to delete section')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <li className="group">
      <Link 
        href={`/sections/${section.id}`}
        className="block rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="inline-block w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
              {section.order}
            </span>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>
                  {statusLabels[status]}
                </span>
                {isCurrentSection && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white font-medium">
                    Current
                  </span>
                )}
                {rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-xs text-gray-600">{rating}/5</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete section"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}
