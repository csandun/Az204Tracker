"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Resource = { id: string; title: string; url: string; type: string }

export function ResourcesPanel({ moduleId, sectionId }: { moduleId: string; sectionId: string }) {
  const supabase = createClient()
  const [items, setItems] = useState<Resource[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('link')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user authentication status
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    void getUser()
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from('resources')
      .select('id,title,url,type')
      .or(`section_id.eq.${sectionId},and(section_id.is.null,module_id.eq.${moduleId})`)
      .order('title', { ascending: true })
    if (!error) setItems(data || [])
  }

  useEffect(() => { void load() }, [moduleId, sectionId])

  async function addResource() {
    setError(null)
    if (!title.trim() || !url.trim()) { setError('Title and URL are required.'); return }
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); setError('Please sign in.'); return }
    const { error } = await supabase.from('resources').insert({ title, url, type, module_id: moduleId, section_id: sectionId })
    if (error) setError(error.message)
    setBusy(false)
    setTitle(''); setUrl(''); setType('link')
    await load()
  }

  async function deleteResource(id: string) {
    setBusy(true)
    await supabase.from('resources').delete().eq('id', id)
    setBusy(false)
    await load()
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map(r => (
          <li key={r.id} className="group relative rounded-lg border border-gray-300 p-3 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/60">
            <div className="text-gray-900 group-hover:text-primary font-medium flex items-center justify-between">
              <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline">{r.title}<span className="ml-2 text-xs text-gray-500">[{r.type}]</span></a>
              {user && (
                <button type="button" className="text-xs text-red-600 hover:underline" disabled={busy} onClick={()=>void deleteResource(r.id)}>Delete</button>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-gray-600">No resources added.</li>}
      </ul>

      {user && (
        <div className="mt-2 rounded-lg border border-gray-300 p-3 bg-white">
          <div className="grid sm:grid-cols-5 gap-2">
            <select className="sm:col-span-1 rounded-md border border-border px-3 py-2" value={type} onChange={e=>setType(e.target.value)}>
              <option value="link">link</option>
              <option value="video">video</option>
              <option value="doc">doc</option>
            </select>
            <input className="sm:col-span-2 rounded-md border border-border px-3 py-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
            <input className="sm:col-span-2 rounded-md border border-border px-3 py-2" placeholder="URL" value={url} onChange={e=>setUrl(e.target.value)} />
            <div className="sm:col-span-5 text-right">
              <button type="button" className="px-3 py-1.5 rounded-md bg-primary text-white disabled:opacity-50" disabled={busy} onClick={()=>void addResource()}>{busy ? 'Adding…' : 'Add resource'}</button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
