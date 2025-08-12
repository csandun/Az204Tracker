'use client'

import { useState } from 'react'

interface Section {
  id: string
  title: string
  order: number
}

interface SectionManagerProps {
  moduleId: string
  sections: Section[]
  onSectionAdded: (section: Section) => void
  onSectionDeleted: (sectionId: string) => void
}

export function SectionManager({ moduleId, sections, onSectionAdded, onSectionDeleted }: SectionManagerProps) {
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deletingSection, setDeletingSection] = useState<string | null>(null)

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionTitle.trim()) return

    setIsLoading(true)
    try {
      const nextOrder = Math.max(...sections.map(s => s.order), 0) + 1
      
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module_id: moduleId,
          title: newSectionTitle.trim(),
          order: nextOrder,
        }),
      })

      if (response.ok) {
        const { data } = await response.json()
        onSectionAdded(data)
        setNewSectionTitle('')
        setIsAddingSection(false)
      } else {
        const { error } = await response.json()
        alert(`Error adding section: ${error}`)
      }
    } catch (error) {
      console.error('Error adding section:', error)
      alert('Failed to add section')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${sectionTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingSection(sectionId)
    try {
      const response = await fetch(`/api/sections?id=${sectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onSectionDeleted(sectionId)
      } else {
        const { error } = await response.json()
        alert(`Error deleting section: ${error}`)
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Failed to delete section')
    } finally {
      setDeletingSection(null)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Manage Sections</h3>
        <button
          onClick={() => setIsAddingSection(!isAddingSection)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {isAddingSection ? 'Cancel' : 'Add Section'}
        </button>
      </div>

      {isAddingSection && (
        <form onSubmit={handleAddSection} className="mb-4 p-3 bg-white rounded border">
          <div className="mb-3">
            <label htmlFor="sectionTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Section Title
            </label>
            <input
              type="text"
              id="sectionTitle"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Enter section title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Add Section
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSection(false)
                setNewSectionTitle('')
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Current Sections:</h4>
        {sections.length === 0 ? (
          <p className="text-sm text-gray-500">No sections yet.</p>
        ) : (
          <ul className="space-y-1">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <li
                  key={section.id}
                  className="flex items-center justify-between px-3 py-2 bg-white rounded border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      #{section.order}
                    </span>
                    <span className="text-sm">{section.title}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSection(section.id, section.title)}
                    disabled={deletingSection === section.id}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {deletingSection === section.id && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    )}
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
