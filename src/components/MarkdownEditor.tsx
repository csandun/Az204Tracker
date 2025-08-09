"use client"
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileUpload } from './FileUpload'
import { FileAttachments } from './FileAttachments'

interface FileAttachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  showFileUpload?: boolean
  attachments?: FileAttachment[]
  onFileUpload?: (filePath: string, fileName: string, fileSize: number, fileType: string) => void
  onFileDelete?: (attachmentId: string) => void
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Write your note... (Markdown supported)",
  minHeight = "180px",
  className = "",
  showFileUpload = false,
  attachments = [],
  onFileUpload,
  onFileDelete
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit')

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = value
    const selectedText = text.substring(start, end)
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
    onChange(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const toolbarButtons = [
    { icon: '**B**', label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: '*I*', label: 'Italic', action: () => insertMarkdown('*', '*') },
    { icon: '~~S~~', label: 'Strikethrough', action: () => insertMarkdown('~~', '~~') },
    { icon: '`C`', label: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: '# H', label: 'Heading', action: () => insertMarkdown('## ', '') },
    { icon: '> Q', label: 'Quote', action: () => insertMarkdown('> ', '') },
    { icon: '- L', label: 'List', action: () => insertMarkdown('- ', '') },
    { icon: '[]()', label: 'Link', action: () => insertMarkdown('[', '](url)') },
  ]

  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className={`border border-gray-300 rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="px-2 py-1 text-xs font-mono border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
          
          {showFileUpload && (
            <button
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className={`px-2 py-1 text-xs border border-gray-200 rounded transition-colors ${
                showUpload ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'
              }`}
              title="Attach File"
            >
              📎
            </button>
          )}
        </div>
        
        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-md p-1">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              mode === 'edit' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              mode === 'preview' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              mode === 'split' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {showFileUpload && showUpload && onFileUpload && (
        <div className="border-b border-gray-200 p-3 bg-gray-50">
          <FileUpload
            onUploadComplete={(filePath, fileName, fileSize, fileType) => {
              onFileUpload(filePath, fileName, fileSize, fileType)
              setShowUpload(false)
            }}
            className="mb-3"
          />
        </div>
      )}

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div className="border-b border-gray-200 p-3 bg-gray-50">
          <FileAttachments
            attachments={attachments}
            onDelete={onFileDelete}
          />
        </div>
      )}

      {/* Editor content */}
      <div className="flex">
        {/* Edit view */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={mode === 'split' ? 'flex-1 border-r border-gray-200' : 'flex-1'}>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border-0 rounded-none focus:ring-0 focus:outline-none resize-none"
              style={{ minHeight }}
            />
          </div>
        )}

        {/* Preview view */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={mode === 'split' ? 'flex-1' : 'flex-1'}>
            <div 
              className="px-3 py-2 prose prose-sm max-w-none overflow-auto"
              style={{ minHeight }}
            >
              {value.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">Preview will appear here...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with help */}
      <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 bg-gray-50">
        <div className="flex items-center justify-between">
          <span>
            Supports: **bold**, *italic*, `code`, [links](url), lists, quotes, and more
          </span>
          <span>{value.length} characters</span>
        </div>
      </div>
    </div>
  )
}
