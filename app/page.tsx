import Link from 'next/link'

export default async function Home() {
  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="h-1.5 w-12 bg-primary rounded-full mb-3" />
        <h1 className="text-3xl font-semibold mb-2 tracking-tight">Welcome</h1>
        <p className="text-gray-700">Track your AZ-204 journey. Sign in to see your dashboard.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/signin" className="px-4 py-2 rounded-lg bg-primary text-white">Sign in</Link>
          <Link href="/modules" className="px-4 py-2 rounded-lg border border-border">Browse modules</Link>
        </div>
      </section>
    </main>
  )
}
