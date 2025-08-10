"use client"
import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownEditor } from './MarkdownEditor'
import { FileAttachments } from './FileAttachments'

type Note = { 
  id: string; 
  text: string; 
  is_done: boolean; 
  sort_order: number | null; 
  parent_id: string | null; 
  created_at?: string | null;
  updated_at?: string | null;
}

type FileAttachment = {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

type SortOption = 'newest' | 'oldest' | 'updated_newest' | 'updated_oldest'

export function ShortNotes({ sectionId }: { sectionId: string }) {
  const [items, setItems] = useState<Note[]>([])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true) // Add loading state
  const [attachmentsLoading, setAttachmentsLoading] = useState(false) // Add attachments loading state
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({})
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => { 
    void load() 
  }, [sectionId])

  useEffect(() => {
    if (items.length > 0) {
      void loadAttachments()
    }
  }, [items])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('short_notes')
        .select('id,text,is_done,sort_order,parent_id,created_at,updated_at')
        .eq('user_id', user.id)
        .eq('section_id', sectionId)
        .order('is_done', { ascending: true })
        .order('created_at', { ascending: false }) // Most recent first
      setItems(data ?? [])
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }, [sectionId])

  // Sort items based on selected sort option
  const sortedItems = useMemo(() => {
    const itemsCopy = [...items]
    
    switch (sortBy) {
      case 'newest':
        return itemsCopy.sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0
          if (!a.created_at) return 1
          if (!b.created_at) return -1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      case 'oldest':
        return itemsCopy.sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0
          if (!a.created_at) return 1
          if (!b.created_at) return -1
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      case 'updated_newest':
        return itemsCopy.sort((a, b) => {
          const aDate = a.updated_at || a.created_at
          const bDate = b.updated_at || b.created_at
          if (!aDate && !bDate) return 0
          if (!aDate) return 1
          if (!bDate) return -1
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })
      case 'updated_oldest':
        return itemsCopy.sort((a, b) => {
          const aDate = a.updated_at || a.created_at
          const bDate = b.updated_at || b.created_at
          if (!aDate && !bDate) return 0
          if (!aDate) return 1
          if (!bDate) return -1
          return new Date(aDate).getTime() - new Date(bDate).getTime()
        })
      default:
        return itemsCopy
    }
  }, [items, sortBy])

  const loadAttachments = useCallback(async () => {
    if (items.length === 0) return
    
    setAttachmentsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      console.log('Loading attachments for items:', items.map(item => item.id))
      const { data, error } = await supabase
        .from('short_note_attachments')
        .select('*')
        .in('short_note_id', items.map(item => item.id))
      
      if (error) {
        console.error('Error loading attachments:', error)
        return
      }
      
      console.log('Loaded attachments:', data)
      
      if (data) {
        const attachmentMap: Record<string, FileAttachment[]> = {}
        data.forEach((attachment: any) => {
          if (!attachmentMap[attachment.short_note_id]) {
            attachmentMap[attachment.short_note_id] = []
          }
          attachmentMap[attachment.short_note_id].push({
            id: attachment.id,
            file_name: attachment.file_name,
            file_path: attachment.file_path,
            file_size: attachment.file_size,
            file_type: attachment.file_type,
            created_at: attachment.created_at
          })
        })
        console.log('Attachment map:', attachmentMap)
        setAttachments(attachmentMap)
      }
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setAttachmentsLoading(false)
    }
  }, [items])

  useEffect(() => { 
    void load() 
  }, [sectionId, load])

  useEffect(() => {
    if (items.length > 0) {
      void loadAttachments()
    }
  }, [items, loadAttachments])

  async function add() {
    if (!text.trim()) return
    setBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); return }
    
    let error
    let noteId = editId
    
    if (editId) {
      ;({ error } = await supabase.from('short_notes').update({ text }).eq('id', editId))
    } else {
      const { data, error: insertError } = await supabase
        .from('short_notes')
        .insert({ user_id: user.id, section_id: sectionId, text, parent_id: replyTo })
        .select('id')
        .single()
      
      error = insertError
      if (data) noteId = data.id
    }
    
    // Add pending attachments to the note
    if (!error && noteId && pendingAttachments.length > 0) {
      try {
        const attachmentInserts = pendingAttachments.map(att => ({
          short_note_id: noteId,
          file_name: att.file_name,
          file_path: att.file_path,
          file_size: att.file_size,
          file_type: att.file_type
        }))
        
        await supabase.from('short_note_attachments').insert(attachmentInserts)
      } catch (attachError) {
        console.log('Attachments not saved (table not ready):', attachError)
      }
    }
    
    if (!error) { 
      setText('')
      setPendingAttachments([])
      setOpen(false)
      setEditId(null)
      await load() // This will trigger the useEffect to load attachments
    }
    setReplyTo(null)
    setBusy(false)
  }

  async function toggle(id: string, is_done: boolean) {
    const supabase = createClient()
    await supabase.from('short_notes').update({ is_done: !is_done }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    const supabase = createClient()
    
    // Delete attachments first
    try {
      await supabase.from('short_note_attachments').delete().eq('short_note_id', id)
    } catch (error) {
      console.log('Error deleting attachments:', error)
    }
    
    await supabase.from('short_notes').delete().eq('id', id)
    await load() // This will trigger the useEffect to load attachments
  }

  const handleFileUpload = (filePath: string, fileName: string, fileSize: number, fileType: string) => {
    const newAttachment: FileAttachment = {
      id: Math.random().toString(36),
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      file_type: fileType,
      created_at: new Date().toISOString()
    }
    setPendingAttachments(prev => [...prev, newAttachment])
  }

  const handleFileDelete = async (attachmentId: string) => {
    // If it's a pending attachment, just remove from state
    if (pendingAttachments.some(att => att.id === attachmentId)) {
      setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId))
      return
    }

    // If it's a saved attachment, delete from database
    const supabase = createClient()
    try {
      await supabase.from('short_note_attachments').delete().eq('id', attachmentId)
      void loadAttachments() // Reload attachments
    } catch (error) {
      console.log('Could not delete attachment:', error)
    }
  }

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Enhanced markdown content component with embedded attachments
  function MarkdownContent({ noteId, content }: { noteId: string, content: string }) {
    const [embeddedContent, setEmbeddedContent] = useState(content)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      const embedAttachments = async () => {
        const noteAttachments = attachments[noteId]
        if (!noteAttachments || noteAttachments.length === 0) {
          setEmbeddedContent(content)
          return
        }

        setLoading(true)
        let embedded = content

        // Add attachments section
        if (noteAttachments.length > 0) {
          embedded += '\n\n---\n\n**Attachments:**\n\n'
        }

        // Process each attachment
        for (const attachment of noteAttachments) {
          const supabase = createClient()
          try {
            const { data, error } = await supabase.storage
              .from('csandun')
              .createSignedUrl(attachment.file_path, 3600)

            if (!error && data.signedUrl) {
              if (attachment.file_type.startsWith('image/')) {
                // Embed images directly
                embedded += `![${attachment.file_name}](${data.signedUrl} "${attachment.file_name}")\n\n`
              } else {
                // Add download links for non-image files
                embedded += `📎 [**${attachment.file_name}**](${data.signedUrl}) *(${formatFileSize(attachment.file_size)})*\n\n`
              }
            }
          } catch (error) {
            console.error('Error creating signed URL for', attachment.file_name, error)
          }
        }

        setEmbeddedContent(embedded)
        setLoading(false)
      }

      embedAttachments()
    }, [noteId, content, attachments])

    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt, title }) => (
              <img 
                src={src} 
                alt={alt} 
                title={title}
                className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 my-2"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            )
          }}
        >
          {embeddedContent}
        </ReactMarkdown>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
            Loading attachments...
          </div>
        )}
      </div>
    )
  }

  const tree = useMemo(() => {
    const byParent: Record<string, Note[]> = {}
    for (const n of sortedItems) {
      const key = n.parent_id ?? 'root'
      byParent[key] = byParent[key] || []
      byParent[key].push(n)
    }
    return byParent
  }, [sortedItems])

  function Thread({ parentId }: { parentId: string | null }) {
    const children = (tree[parentId ?? 'root'] || [])
    if (children.length === 0) return null
    return (
      <ul className={parentId ? 'ml-6 space-y-2' : 'space-y-2'}>
        {children.map(i => (
          <li key={i.id} className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
            <div className="p-4">
              <MarkdownContent noteId={i.id} content={i.text} />
              
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  {i.created_at && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(i.created_at).toLocaleDateString()} {new Date(i.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                  {i.updated_at && i.updated_at !== i.created_at && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      edited {new Date(i.updated_at).toLocaleDateString()} {new Date(i.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50" 
                    onClick={() => { 
                      setReplyTo(i.id); 
                      setEditId(null); 
                      setText(''); 
                      setOpen(true) 
                    }}
                  >
                    💬 Reply
                  </button>
                  <button 
                    className="hover:text-amber-600 transition-colors px-2 py-1 rounded hover:bg-amber-50" 
                    onClick={() => { 
                      setEditId(i.id); 
                      setText(i.text); 
                      setReplyTo(null); 
                      setOpen(true) 
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50" 
                    onClick={() => remove(i.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
            <Thread parentId={i.id} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold tracking-tight">Short Notes</h3>
          </div>
          {(loading || items.length > 0) && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {loading ? (
                <div className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                `${items.length} note${items.length !== 1 ? 's' : ''}`
              )}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          {items.length > 1 && (
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md hover:border-primary/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="newest">📅 Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="updated_newest">✏️ Recently Updated</option>
                <option value="updated_oldest">✏️ Least Updated</option>
              </select>
            </div>
          )}
          
          <button 
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md hover:border-primary/60 transition-all duration-200 hover:-translate-y-0.5" 
            onClick={() => setOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Note
          </button>
        </div>
      </div>
      <Thread parentId={null} />
      
      {loading ? (
        <div className="space-y-2">
          {/* Loading skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
              <div className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No notes yet</p>
          <p className="text-sm text-gray-400">Create your first note to get started</p>
        </div>
      ) : null}

      {/* Show attachments loading indicator */}
      {attachmentsLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            <span>Loading attachments...</span>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-xl border border-gray-300 bg-white shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold">
                {editId ? 'Edit short note' : replyTo ? 'Reply to note' : 'Add short note'}
              </h4>
              {replyTo && (
                <div className="mt-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
                  💬 Replying to a note
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6 overflow-hidden">
              <MarkdownEditor
                value={text}
                onChange={setText}
                placeholder="Write a short note... (Markdown supported)"
                minHeight="300px"
                className="h-full"
                showFileUpload={true}
                attachments={pendingAttachments}
                onFileUpload={handleFileUpload}
                onFileDelete={handleFileDelete}
              />
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors" 
                onClick={() => { 
                  setOpen(false); 
                  setEditId(null); 
                  setReplyTo(null); 
                  setText('');
                  setPendingAttachments([]);
                }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors" 
                disabled={busy || !text.trim()} 
                onClick={add}
              >
                {busy ? (editId ? 'Saving…' : 'Adding…') : (editId ? 'Save Changes' : 'Add Note')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
