"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { DutyAssignment } from "@/lib/types"

export async function getAssignmentsBySchedule(scheduleId: string): Promise<DutyAssignment[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("duty_assignments")
    .select("*, employee:employees(*)")
    .eq("schedule_id", scheduleId)
    .order("created_at")
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createAssignment(input: {
  schedule_id: string
  employee_id: string
  wajib_hadir?: boolean
  catatan?: string
}): Promise<DutyAssignment> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("duty_assignments")
    .insert({
      schedule_id: input.schedule_id,
      employee_id: input.employee_id,
      wajib_hadir: input.wajib_hadir ?? false,
      catatan: input.catatan ?? null,
    })
    .select("*, employee:employees(*)")
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateAssignment(
  id: string,
  input: Partial<{
    wajib_hadir: boolean
    catatan: string
  }>
): Promise<DutyAssignment> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("duty_assignments")
    .update(input)
    .eq("id", id)
    .select("*, employee:employees(*)")
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function removeAssignment(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from("duty_assignments")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function getAvailableEmployeesForSchedule(scheduleId: string): Promise<
  { id: string; nama_lengkap: string; nip: string }[]
> {
  const supabase = await createServerSupabaseClient()

  const { data: assigned } = await supabase
    .from("duty_assignments")
    .select("employee_id")
    .eq("schedule_id", scheduleId)

  const assignedIds = assigned?.map((a) => a.employee_id) ?? []

  let query = supabase
    .from("employees")
    .select("id, nama_lengkap, nip")
    .eq("status_aktif", true)
    .order("nama_lengkap")

  if (assignedIds.length > 0) {
    query = query.not("id", "in", `(${assignedIds.join(",")})`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
