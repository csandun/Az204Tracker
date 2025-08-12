"use client"
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ProgressControls({ moduleId, sectionId }: { moduleId: string; sectionId: string }) {
  const [status, setStatus] = useState<'not_started'|'in_progress'|'done'|'skipped'>('not_started')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Load section-level progress instead of module-level
      const { data } = await supabase
        .from('section_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('section_id', sectionId)
        .maybeSingle()
      
      if (data) {
        setStatus(data.status as any)
      }
    } catch (err) {
      console.error('Error loading section progress status:', err)
    }
  }, [sectionId])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  async function update(newStatus: 'not_started'|'in_progress'|'done'|'skipped') {
    setError(null)
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        setError('Please sign in to update progress')
        setBusy(false)
        return 
      }
      
      // Update section-level progress
      const { error } = await supabase
        .from('section_progress')
        .upsert({ 
          user_id: user.id, 
          section_id: sectionId,
          status: newStatus 
        }, { onConflict: 'user_id,section_id' })
      
      if (error) {
        setError(error.message)
        console.error('Section progress update error:', error)
      } else {
        setStatus(newStatus)
        console.log('Section progress updated successfully:', newStatus)
      }
    } catch (err) {
      setError('Failed to update section progress')
      console.error('Section progress update exception:', err)
    }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {(['not_started','in_progress','done','skipped'] as const).map(s => (
        <button key={s} disabled={busy || status===s}
          onClick={() => update(s)}
          className={`px-2 py-1 rounded-md text-sm border transition-colors ${
            status===s 
              ? 'bg-primary text-white border-primary' 
              : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }`}>
          {s.replace('_',' ')}
        </button>
      ))}
    </div>
  )
}
