"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Employee } from "@/lib/types"

export async function getEmployees(options?: {
  search?: string
  status_aktif?: boolean
}): Promise<Employee[]> {
  const supabase = await createServerSupabaseClient()
  let query = supabase.from("employees").select("*").order("nama_lengkap")

  if (options?.status_aktif !== undefined) {
    query = query.eq("status_aktif", options.status_aktif)
  }

  if (options?.search) {
    query = query.or(
      `nip.ilike.%${options.search}%,nama_lengkap.ilike.%${options.search}%,unit_kerja.ilike.%${options.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createEmployee(input: {
  nip: string
  nama_lengkap: string
  jabatan?: string
  unit_kerja?: string
  nomor_hp?: string
  email?: string
}): Promise<Employee> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("employees")
    .insert({
      nip: input.nip,
      nama_lengkap: input.nama_lengkap,
      jabatan: input.jabatan ?? null,
      unit_kerja: input.unit_kerja ?? null,
      nomor_hp: input.nomor_hp ?? null,
      email: input.email ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateEmployee(
  id: string,
  input: Partial<{
    nip: string
    nama_lengkap: string
    jabatan: string
    unit_kerja: string
    nomor_hp: string
    email: string
    status_aktif: boolean
  }>
): Promise<Employee> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("employees")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function softDeleteEmployee(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from("employees")
    .update({ status_aktif: false })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function restoreEmployee(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from("employees")
    .update({ status_aktif: true })
    .eq("id", id)
  if (error) throw new Error(error.message)
}
