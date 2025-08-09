"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MarkdownEditor } from './MarkdownEditor'

export function NotesEditor({ sectionId }: { sectionId: string }) {
  const [noteId, setNoteId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notes')
        .select('id,title,content')
        .eq('user_id', user.id)
        .eq('section_id', sectionId)
        .limit(1)
        .maybeSingle()
      if (data) {
        setNoteId(data.id)
        setTitle(data.title ?? '')
        setContent(data.content ?? '')
      }
    })()
  }, [sectionId])

  async function save() {
    setBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); return }
    if (noteId) {
      await supabase.from('notes').update({ title, content }).eq('id', noteId)
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert({ user_id: user.id, section_id: sectionId, title, content })
        .select('id')
        .single()
      if (!error) setNoteId(data.id)
    }
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Section Notes</h3>
      </div>
      
      <input 
        className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
        placeholder="Note title"
        value={title} 
        onChange={e => setTitle(e.target.value)} 
      />
      
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Write your detailed notes here... (Markdown supported)"
        minHeight="300px"
      />
      
      <div className="flex justify-end">
        <button 
          onClick={save} 
          disabled={busy} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {busy ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Notes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
