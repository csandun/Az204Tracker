"use client"
import { useState } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) { setError('Invalid email or password'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })
    setLoading(false)
    if (error) { 
      setError(error.message); 
      return 
    }
    
    // Check if the user was created and is confirmed
    if (data.user) {
      if (data.user.email_confirmed_at) {
        // User is already confirmed, redirect to dashboard
        setSuccess('Account created successfully! Redirecting...')
        setTimeout(() => router.replace('/dashboard'), 1000)
      } else {
        // User needs to confirm email
        setSuccess('Account created! Please check your email and click the confirmation link to complete registration.')
      }
    }
  }

  return (
    <main className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input className="w-full rounded-lg bg-white border border-border px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Password</label>
          <input className="w-full rounded-lg bg-white border border-border px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <button disabled={loading} className="w-full px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/signin" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  )
}
