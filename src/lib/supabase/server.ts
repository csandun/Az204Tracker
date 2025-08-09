import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null as unknown as ReturnType<typeof createServerClient>
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      }
    }
  })
}
