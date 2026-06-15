"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Attendance, AttendanceStatus } from "@/lib/types"

export async function getAttendanceBySchedule(scheduleId: string): Promise<Attendance[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("attendance")
    .select("*, employee:employees(*)")
    .eq("schedule_id", scheduleId)
    .order("created_at")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertAttendance(input: {
  schedule_id: string
  employee_id: string
  status: AttendanceStatus
  waktu_absen?: string
  catatan?: string
  created_by?: string
}): Promise<Attendance> {
  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("schedule_id", input.schedule_id)
    .eq("employee_id", input.employee_id)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from("attendance")
      .update({
        status: input.status,
        waktu_absen: input.waktu_absen ?? null,
        catatan: input.catatan ?? null,
      })
      .eq("id", existing.id)
      .select("*, employee:employees(*)")
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      schedule_id: input.schedule_id,
      employee_id: input.employee_id,
      status: input.status,
      waktu_absen: input.waktu_absen ?? null,
      catatan: input.catatan ?? null,
      created_by: input.created_by ?? null,
    })
    .select("*, employee:employees(*)")
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getTodaySchedules() {
  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("activity_schedules")
    .select("*, activity:activities(*), assignments:duty_assignments(*, employee:employees(*))")
    .in("status", ["published", "completed"])
    .eq("tanggal", today)
    .order("jam_mulai")

  if (error) throw new Error(error.message)

  const schedulesWithAttendance = await Promise.all(
    (data ?? []).map(async (schedule) => {
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*, employee:employees(*)")
        .eq("schedule_id", schedule.id)

      return { ...schedule, attendance: attendanceData ?? [] }
    })
  )

  return schedulesWithAttendance
}
