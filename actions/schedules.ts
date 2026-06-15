"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { ActivitySchedule, ScheduleStatus } from "@/lib/types"

export async function getSchedules(options?: {
  month?: number
  year?: number
  activity_id?: string
}): Promise<ActivitySchedule[]> {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from("activity_schedules")
    .select("*, activity:activities(*)")
    .order("tanggal", { ascending: false })

  if (options?.activity_id) {
    query = query.eq("activity_id", options.activity_id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let schedules = data ?? []

  if (options?.month && options?.year) {
    schedules = schedules.filter((s) => {
      const date = new Date(s.tanggal)
      return (
        date.getMonth() + 1 === options.month &&
        date.getFullYear() === options.year
      )
    })
  }

  return schedules
}

export async function getScheduleById(id: string): Promise<ActivitySchedule | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("activity_schedules")
    .select("*, activity:activities(*), assignments:duty_assignments(*, employee:employees(*))")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createSchedule(input: {
  activity_id: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  lokasi?: string
  keterangan?: string
  status?: ScheduleStatus
}): Promise<ActivitySchedule> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("activity_schedules")
    .insert({
      activity_id: input.activity_id,
      tanggal: input.tanggal,
      jam_mulai: input.jam_mulai,
      jam_selesai: input.jam_selesai,
      lokasi: input.lokasi ?? null,
      keterangan: input.keterangan ?? null,
      status: input.status ?? "draft",
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateSchedule(
  id: string,
  input: Partial<{
    activity_id: string
    tanggal: string
    jam_mulai: string
    jam_selesai: string
    lokasi: string
    keterangan: string
    status: ScheduleStatus
  }>
): Promise<ActivitySchedule> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("activity_schedules")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
