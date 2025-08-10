import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <main className="max-w-md mx-auto text-center">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          Sorry, there was an error confirming your email address. The confirmation link may have expired or been used already.
        </p>
        <div className="space-y-3">
          <Link 
            href="/signup" 
            className="inline-block w-full px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Try signing up again
          </Link>
          <Link 
            href="/signin" 
            className="inline-block w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-primary/60 transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </main>
  )
}
