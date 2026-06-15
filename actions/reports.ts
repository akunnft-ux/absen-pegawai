"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { MonthlyRecap, ActivityRecap } from "@/lib/types"

export async function getMonthlyRecap(
  month: number,
  year: number
): Promise<MonthlyRecap[]> {
  const supabase = await createServerSupabaseClient()

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, nama_lengkap, nip")
    .eq("status_aktif", true)
    .order("nama_lengkap")

  if (empError) throw new Error(empError.message)

  const { data: attendances, error: attError } = await supabase
    .from("attendance")
    .select("*, schedule:activity_schedules!inner(tanggal)")
    .gte("schedule.tanggal", startDate)
    .lte("schedule.tanggal", endDate)

  if (attError) throw new Error(attError.message)

  const recap: MonthlyRecap[] = (employees ?? []).map((emp) => {
    const empAttendance = (attendances ?? []).filter(
      (a) => a.employee_id === emp.id
    )

    const jumlah_hadir = empAttendance.filter((a) => a.status === "hadir").length
    const jumlah_terlambat = empAttendance.filter((a) => a.status === "terlambat").length
    const jumlah_izin = empAttendance.filter((a) => a.status === "izin").length
    const jumlah_sakit = empAttendance.filter((a) => a.status === "sakit").length
    const jumlah_alpha = empAttendance.filter((a) => a.status === "alpha").length
    const jumlah_pengganti = empAttendance.filter((a) => a.status === "pengganti").length

    const total_hadir_efektif = jumlah_hadir + jumlah_terlambat
    const total_penugasan = empAttendance.length
    const persentase_kehadiran =
      total_penugasan > 0
        ? Math.round((total_hadir_efektif / total_penugasan) * 100)
        : 0

    return {
      employee_id: emp.id,
      nama_lengkap: emp.nama_lengkap,
      nip: emp.nip,
      jumlah_hadir,
      jumlah_terlambat,
      jumlah_izin,
      jumlah_sakit,
      jumlah_alpha,
      jumlah_pengganti,
      total_penugasan,
      persentase_kehadiran,
    }
  })

  return recap
}

export async function getActivityRecap(
  month: number,
  year: number
): Promise<ActivityRecap[]> {
  const supabase = await createServerSupabaseClient()

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  const { data: activities, error: actError } = await supabase
    .from("activities")
    .select("*")
    .eq("aktif", true)
    .order("nama_kegiatan")

  if (actError) throw new Error(actError.message)

  const { data: schedules, error: schError } = await supabase
    .from("activity_schedules")
    .select("id, activity_id, activity:activities!inner(nama_kegiatan)")
    .gte("tanggal", startDate)
    .lte("tanggal", endDate)

  if (schError) throw new Error(schError.message)

  const scheduleIds = (schedules ?? []).map((s) => s.id)

  const { data: attendances, error: attError } = await supabase
    .from("attendance")
    .select("schedule_id, employee_id, status")
    .in("schedule_id", scheduleIds)

  if (attError) throw new Error(attError.message)

  const recap: ActivityRecap[] = (activities ?? []).map((act) => {
    const activityScheduleIds = (schedules ?? [])
      .filter((s) => s.activity_id === act.id)
      .map((s) => s.id)

    const activityAttendances = (attendances ?? []).filter((a) =>
      activityScheduleIds.includes(a.schedule_id)
    )

    const jumlah_peserta = new Set(activityAttendances.map((a) => a.employee_id)).size
    const jumlah_hadir = activityAttendances.filter(
      (a) => a.status === "hadir" || a.status === "terlambat"
    ).length
    const jumlah_alpha = activityAttendances.filter((a) => a.status === "alpha").length
    const persentase_kehadiran =
      activityAttendances.length > 0
        ? Math.round(
            (activityAttendances.filter(
              (a) => a.status === "hadir" || a.status === "terlambat"
            ).length /
              activityAttendances.length) *
              100
          )
        : 0

    return {
      activity_id: act.id,
      nama_kegiatan: act.nama_kegiatan,
      jumlah_peserta,
      jumlah_hadir,
      jumlah_alpha,
      persentase_kehadiran,
    }
  })

  return recap.filter((r) => r.jumlah_peserta > 0)
}
