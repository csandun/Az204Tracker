'use client'

import { useState, useEffect } from 'react'
import { SectionWithDelete } from '@/components/SectionWithDelete'
import { AddSectionModal } from '@/components/AddSectionModal'

interface Section {
  id: string
  title: string
  order: number
}

interface SectionsWithManagementProps {
  moduleId: string
  initialSections: Section[]
  isAuthenticated: boolean
  ratingsMap: Map<string, number>
  sectionProgressMap: Map<string, string>
  currentSectionId: string | null
}

export function SectionsWithManagement({ 
  moduleId, 
  initialSections, 
  isAuthenticated,
  ratingsMap,
  sectionProgressMap,
  currentSectionId
}: SectionsWithManagementProps) {
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    // Simulate initial load completion
    const timer = setTimeout(() => setIsInitialLoad(false), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSectionAdded = (newSection: Section) => {
    setSections(prev => [...prev, newSection].sort((a, b) => a.order - b.order))
  }

  const handleSectionDeleted = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
  }

  const refreshSections = async () => {
    setIsLoading(true)
    try {
      // You can implement a refresh API call here if needed
      // For now, we'll just simulate a refresh
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error refreshing sections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextOrder = Math.max(...sections.map(s => s.order), 0) + 1

  if (isInitialLoad) {
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-primary/70" /> 
            Sections
          </h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-primary/70" /> 
          Sections
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <button
                onClick={refreshSections}
                disabled={isLoading}
                className="px-2 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                title="Refresh sections"
              >
                <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Add
              </button>
            </>
          )}
        </div>
      </div>
      
      <ul className="space-y-2">
        {sections.map((section) => {
          const rating = ratingsMap.get(section.id)
          const sectionStatus = (sectionProgressMap.get(section.id) || 'not_started') as 'not_started' | 'in_progress' | 'done' | 'skipped'
          const isCurrentSection = currentSectionId === section.id
          
          return (
            <SectionWithDelete
              key={section.id}
              section={section}
              status={sectionStatus}
              isCurrentSection={isCurrentSection}
              rating={rating}
              isAuthenticated={isAuthenticated}
              onDelete={handleSectionDeleted}
            />
          )
        })}
        {sections.length === 0 && !isLoading && (
          <li className="text-gray-700 py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-8.25m0 0V7.875c0-1.036.84-1.875 1.875-1.875h3.75c1.036 0 1.875.84 1.875 1.875v.375m-8.25 0V8.25A2.25 2.25 0 004.5 6h15A2.25 2.25 0 0121.75 8.25v7.5A2.25 2.25 0 0119.5 18h-15a2.25 2.25 0 01-2.25-2.25V10.5z" />
              </svg>
              <p className="text-sm text-gray-500">No sections yet</p>
              {isAuthenticated && (
                <p className="text-xs text-gray-400">Click &ldquo;Add&rdquo; to create your first section</p>
              )}
            </div>
          </li>
        )}
        {isLoading && sections.length === 0 && (
          <li className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm">Loading sections...</span>
            </div>
          </li>
        )}
      </ul>

      <AddSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        moduleId={moduleId}
        onSectionAdded={handleSectionAdded}
        nextOrder={nextOrder}
      />
    </section>
  )
}
