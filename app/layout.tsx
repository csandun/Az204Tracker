import type { Metadata } from 'next'
import './globals.css'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'AZ-204 Study Tracker',
  description: 'Track your AZ-204 study progress',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: null as any } }
  const hasSession = !!user
  return (
    <html lang="en" className="h-full bg-white">
      <body className={clsx(
        'min-h-screen text-gray-900 bg-white',
        'antialiased selection:bg-primary/20 selection:text-gray-900'
      )}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <header className="flex items-center justify-between mb-6">
            <a href="/" className="font-semibold text-lg">AZ-204 Study Tracker</a>
            <nav className="text-sm text-gray-600 flex items-center gap-4">
              <a className="hover:text-gray-900" href="/dashboard">Dashboard</a>
              <a className="hover:text-gray-900" href="/modules">Modules</a>
              {!hasSession && (
                <>
                  <a className="hover:text-gray-900" href="/signin">Sign in</a>
                  <a className="hover:text-gray-900" href="/signup">Sign up</a>
                </>
              )}
              {hasSession && (
                <form action="/signout" method="post">
                  <button className="hover:text-gray-900" type="submit">Sign out</button>
                </form>
              )}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
