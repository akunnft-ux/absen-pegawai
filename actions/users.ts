"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { User, UserRole } from "@/lib/types"

export async function getUsers(): Promise<User[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("full_name")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createUser(input: {
  email: string
  password: string
  full_name: string
  role: UserRole
}): Promise<User> {
  const supabase = await createServerSupabaseClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })

  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error("Failed to create auth user")

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
    })
    .select()
    .single()

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error(error.message)
  }

  return data
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)
  if (error) throw new Error(error.message)
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) throw new Error(authError.message)

  const { error } = await supabase.from("users").delete().eq("id", userId)
  if (error) throw new Error(error.message)
}
