'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(prevState: { error: string }, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi' }
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  // Get user role from the users table
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profile?.role === 'grand_admin') {
    redirect('/dashboard')
  }

  redirect('/attendance')
}

export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
