"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function StarRating({ sectionId, initial }: { sectionId: string; initial?: number | null }) {
  const [rating, setRating] = useState<number | null>(initial ?? null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (initial != null) return
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('ratings')
        .select('stars')
        .eq('user_id', user.id)
        .eq('section_id', sectionId)
        .maybeSingle()
      if (data) setRating(data.stars)
    })()
  }, [sectionId, initial])

  async function setStars(stars: number) {
    setBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); return }
    const { error } = await supabase
      .from('ratings')
      .upsert({ user_id: user.id, section_id: sectionId, stars }, { onConflict: 'user_id,section_id' })
    if (!error) setRating(stars)
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} disabled={busy}
          onClick={() => setStars(star)}
          className={(rating ?? 0) >= star ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}>
          ★
        </button>
      ))}
    </div>
  )
}
