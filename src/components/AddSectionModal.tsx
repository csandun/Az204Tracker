'use client'

import { useState } from 'react'
import { Modal } from './Modal'

interface AddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  moduleId: string
  onSectionAdded: (section: { id: string; title: string; order: number }) => void
  nextOrder: number
}

export function AddSectionModal({ isOpen, onClose, moduleId, onSectionAdded, nextOrder }: AddSectionModalProps) {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module_id: moduleId,
          title: title.trim(),
          order: nextOrder,
        }),
      })

      if (response.ok) {
        const { data } = await response.json()
        onSectionAdded(data)
        setTitle('')
        onClose()
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

  const handleClose = () => {
    setTitle('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Section">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sectionTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Section Title
          </label>
          <input
            type="text"
            id="sectionTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter section title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            autoFocus
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be section #{nextOrder}
          </p>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            Add Section
          </button>
        </div>
      </form>
    </Modal>
  )
}
