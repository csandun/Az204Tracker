"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function UploadImage({ sectionId, moduleId }: { sectionId: string; moduleId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); return }
    const path = `${user.id}/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${crypto.randomUUID()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('uploads').upload(path, file)
    if (upErr) { setError(upErr.message); setBusy(false); return }
    const file_url = `uploads/${path}`
    await supabase.from('uploads').insert({ user_id: user.id, module_id: moduleId, section_id: sectionId, file_url, kind: 'screenshot' })
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2">
      <input type="file" accept="image/*" onChange={onFile} disabled={busy} />
      {busy && <span className="text-sm text-gray-400">Uploading…</span>}
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  )
}
