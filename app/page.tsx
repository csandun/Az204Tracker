import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createClient()
  
  // Check if user is authenticated
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    
    // If user is logged in, redirect to dashboard
    if (user) {
      redirect('/dashboard')
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
        <h1 className="text-3xl font-semibold mb-2 tracking-tight">Welcome to AZ-204 Study Tracker</h1>
        <p className="text-gray-700 mb-4">Track your AZ-204 certification journey with organized modules, progress tracking, and interactive notes.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/signin" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
            Sign in to get started
          </Link>
          <Link href="/modules" className="px-4 py-2 rounded-lg border border-gray-300 hover:border-primary/60 transition-colors">
            Browse modules
          </Link>
        </div>
      </section>
      
      <section className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
        <div className="h-1.5 w-12 bg-blue-500 rounded-full mb-3" />
        <h2 className="text-xl font-semibold mb-3">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Progress Tracking</p>
              <p className="text-gray-600">Track your study progress across modules and sections</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Interactive Notes</p>
              <p className="text-gray-600">Create rich notes with file attachments and threading</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Section Rating</p>
              <p className="text-gray-600">Rate difficulty and usefulness of study sections</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">File Upload</p>
              <p className="text-gray-600">Attach images and documents to your notes</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
