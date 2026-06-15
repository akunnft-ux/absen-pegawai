"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Activity } from "@/lib/types"

export async function getActivities(options?: {
  search?: string
  aktif?: boolean
}): Promise<Activity[]> {
  const supabase = await createServerSupabaseClient()
  let query = supabase.from("activities").select("*").order("nama_kegiatan")

  if (options?.aktif !== undefined) {
    query = query.eq("aktif", options.aktif)
  }

  if (options?.search) {
    query = query.or(
      `nama_kegiatan.ilike.%${options.search}%,deskripsi.ilike.%${options.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getActivityById(id: string): Promise<Activity | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createActivity(input: {
  nama_kegiatan: string
  deskripsi?: string
}): Promise<Activity> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("activities")
    .insert({
      nama_kegiatan: input.nama_kegiatan,
      deskripsi: input.deskripsi ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateActivity(
  id: string,
  input: Partial<{
    nama_kegiatan: string
    deskripsi: string
    aktif: boolean
  }>
): Promise<Activity> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("activities")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function toggleActivity(id: string, aktif: boolean): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from("activities")
    .update({ aktif })
    .eq("id", id)
  if (error) throw new Error(error.message)
}
