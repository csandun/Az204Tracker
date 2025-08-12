'use client'

import { useState } from 'react'
import { SectionManager } from '@/components/SectionManager'

interface Section {
  id: string
  title: string
  order: number
}

interface ModuleSectionManagerProps {
  moduleId: string
  initialSections: Section[]
  isAuthenticated: boolean
}

export function ModuleSectionManager({ moduleId, initialSections, isAuthenticated }: ModuleSectionManagerProps) {
  const [sections, setSections] = useState<Section[]>(initialSections)

  if (!isAuthenticated) {
    return null // Don't show management interface to non-authenticated users
  }

  const handleSectionAdded = (newSection: Section) => {
    setSections(prev => [...prev, newSection])
  }

  const handleSectionDeleted = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
  }

  return (
    <div className="mt-6">
      <SectionManager
        moduleId={moduleId}
        sections={sections}
        onSectionAdded={handleSectionAdded}
        onSectionDeleted={handleSectionDeleted}
      />
    </div>
  )
}
