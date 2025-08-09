"use server"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SignOut() {
  const supabase = createClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  redirect('/')
}
