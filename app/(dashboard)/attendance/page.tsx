"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Save, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { getTodaySchedules, upsertAttendance } from "@/actions/attendance"
import { useAuth } from "@/hooks/useAuth"
import type { AttendanceStatus } from "@/lib/types"

interface ScheduleWithAttendance {
  id: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  lokasi: string | null
  status: string
  activity: { nama_kegiatan: string } | null
  assignments: {
    id: string
    employee_id: string
    wajib_hadir: boolean
    employee: { id: string; nama_lengkap: string; nip: string } | null
  }[]
  attendance: {
    id: string
    employee_id: string
    status: string
    waktu_absen: string | null
    catatan: string | null
  }[]
}

const attendanceBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  hadir: { label: "Hadir", variant: "default" },
  terlambat: { label: "Terlambat", variant: "secondary" },
  izin: { label: "Izin", variant: "outline" },
  sakit: { label: "Sakit", variant: "outline" },
  alpha: { label: "Alpha", variant: "destructive" },
  pengganti: { label: "Pengganti", variant: "default" },
}

export default function AttendancePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [schedules, setSchedules] = useState<ScheduleWithAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendanceChanges, setAttendanceChanges] = useState<
    Record<string, { status: AttendanceStatus; catatan: string; waktu_absen: string }>
  >({})
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTodaySchedules()
      setSchedules(data as unknown as ScheduleWithAttendance[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data absensi")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleChange = (
    scheduleId: string,
    employeeId: string,
    field: "status" | "catatan" | "waktu_absen",
    value: string
  ) => {
    const key = `${scheduleId}-${employeeId}`
    setAttendanceChanges((prev) => ({
      ...prev,
      [key]: {
        status: (field === "status" ? value : prev[key]?.status ?? "hadir") as AttendanceStatus,
        catatan: field === "catatan" ? value : prev[key]?.catatan ?? "",
        waktu_absen: field === "waktu_absen" ? value : prev[key]?.waktu_absen ?? new Date().toISOString().slice(0, 16),
      },
    }))
  }

  const handleSave = async (scheduleId: string, employeeId: string) => {
    const key = `${scheduleId}-${employeeId}`
    const change = attendanceChanges[key]
    if (!change) return
    try {
      setSavingAttendance((prev) => ({ ...prev, [key]: true }))
      await upsertAttendance({
        schedule_id: scheduleId,
        employee_id: employeeId,
        status: change.status,
        waktu_absen:
          change.status === "hadir" || change.status === "terlambat"
            ? change.waktu_absen || new Date().toISOString()
            : undefined,
        catatan:
          change.status === "izin" || change.status === "sakit"
            ? change.catatan
            : undefined,
        created_by: profile?.id ?? undefined,
      })
      setAttendanceChanges((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan absensi")
    } finally {
      setSavingAttendance((prev) => ({ ...prev, [key]: false }))
    }
  }

  const getExistingAttendance = (scheduleId: string, employeeId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    return schedule?.attendance.find((a) => a.employee_id === employeeId)
  }

  if (loading) return <LoadingState variant="skeleton" rows={8} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Absensi Hari Ini</h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchData()}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <Button variant="link" size="sm" onClick={() => setError(null)} className="ml-2">
            Tutup
          </Button>
        </div>
      )}

      {schedules.length === 0 && !loading ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Tidak Ada Jadwal Hari Ini"
          description="Tidak ada jadwal yang dipublikasikan untuk hari ini."
        />
      ) : (
        <div className="space-y-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {schedule.activity?.nama_kegiatan ?? "Kegiatan"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {schedule.jam_mulai.slice(0, 5)} -{" "}
                      {schedule.jam_selesai.slice(0, 5)}
                      {schedule.lokasi && ` | ${schedule.lokasi}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/schedules/${schedule.id}`)}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Detail
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {schedule.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada petugas ditugaskan.
                  </p>
                ) : (
                  <>
                    {/* Desktop table view */}
                    <div className="hidden md:block">
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                Pegawai
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                NIP
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                Status
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                Waktu / Catatan
                              </th>
                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.assignments.map((a) => {
                              const key = `${schedule.id}-${a.employee_id}`
                              const existing = getExistingAttendance(
                                schedule.id,
                                a.employee_id
                              )
                              const changes = attendanceChanges[key]
                              const currentStatus =
                                changes?.status ?? existing?.status ?? "hadir"
                              const currentCatatan =
                                changes?.catatan ?? existing?.catatan ?? ""
                              const currentWaktu =
                                changes?.waktu_absen ??
                                existing?.waktu_absen ??
                                new Date().toISOString().slice(0, 16)
                              const isSaving = savingAttendance[key]
                              const existingBadge = existing
                                ? attendanceBadge[existing.status]
                                : null

                              return (
                                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="px-4 py-2 font-medium">
                                    {a.employee?.nama_lengkap ?? "-"}
                                  </td>
                                  <td className="px-4 py-2 text-muted-foreground">
                                    {a.employee?.nip ?? "-"}
                                  </td>
                                  <td className="px-4 py-2">
                                    {existingBadge && !changes ? (
                                      <Badge variant={existingBadge.variant}>
                                        {existingBadge.label}
                                      </Badge>
                                    ) : (
                                      <Select
                                        value={currentStatus as string}
                                        onValueChange={(v) =>
                                          handleChange(
                                            schedule.id,
                                            a.employee_id,
                                            "status",
                                            v
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-7 w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="hadir">
                                            Hadir
                                          </SelectItem>
                                          <SelectItem value="terlambat">
                                            Terlambat
                                          </SelectItem>
                                          <SelectItem value="izin">
                                            Izin
                                          </SelectItem>
                                          <SelectItem value="sakit">
                                            Sakit
                                          </SelectItem>
                                          <SelectItem value="alpha">
                                            Alpha
                                          </SelectItem>
                                          <SelectItem value="pengganti">
                                            Pengganti
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </td>
                                  <td className="px-4 py-2">
                                    {(currentStatus === "hadir" ||
                                      currentStatus === "terlambat") && (
                                      <Input
                                        type="datetime-local"
                                        value={currentWaktu}
                                        onChange={(e) =>
                                          handleChange(
                                            schedule.id,
                                            a.employee_id,
                                            "waktu_absen",
                                            e.target.value
                                          )
                                        }
                                        className="h-7 w-40"
                                      />
                                    )}
                                    {(currentStatus === "izin" ||
                                      currentStatus === "sakit") && (
                                      <Input
                                        value={currentCatatan}
                                        onChange={(e) =>
                                          handleChange(
                                            schedule.id,
                                            a.employee_id,
                                            "catatan",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Catatan..."
                                        className="h-7 w-40"
                                      />
                                    )}
                                  </td>
                                  <td className="px-4 py-2">
                                    <Button
                                      size="sm"
                                      variant={
                                        existing && !changes
                                          ? "outline"
                                          : "default"
                                      }
                                      onClick={() =>
                                        handleSave(
                                          schedule.id,
                                          a.employee_id
                                        )
                                      }
                                      disabled={isSaving || !changes}
                                      className="h-7"
                                    >
                                      <Save className="mr-1 h-3 w-3" />
                                      {isSaving ? "..." : existing && !changes ? "Tersimpan" : "Simpan"}
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile card view */}
                    <div className="space-y-3 md:hidden">
                      {schedule.assignments.map((a) => {
                        const key = `${schedule.id}-${a.employee_id}`
                        const existing = getExistingAttendance(
                          schedule.id,
                          a.employee_id
                        )
                        const changes = attendanceChanges[key]
                        const currentStatus =
                          changes?.status ?? existing?.status ?? "hadir"
                        const currentCatatan =
                          changes?.catatan ?? existing?.catatan ?? ""
                        const currentWaktu =
                          changes?.waktu_absen ??
                          existing?.waktu_absen ??
                          new Date().toISOString().slice(0, 16)
                        const isSaving = savingAttendance[key]

                        return (
                          <div key={a.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {a.employee?.nama_lengkap ?? "-"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {a.employee?.nip ?? "-"}
                                </p>
                              </div>
                              {existing && !changes && (
                                <Badge
                                  variant={
                                    attendanceBadge[existing.status]?.variant ??
                                    "secondary"
                                  }
                                >
                                  {attendanceBadge[existing.status]?.label ??
                                    existing.status}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3 space-y-2">
                              <Select
                                value={currentStatus as string}
                                onValueChange={(v) =>
                                  handleChange(
                                    schedule.id,
                                    a.employee_id,
                                    "status",
                                    v
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hadir">Hadir</SelectItem>
                                  <SelectItem value="terlambat">
                                    Terlambat
                                  </SelectItem>
                                  <SelectItem value="izin">Izin</SelectItem>
                                  <SelectItem value="sakit">Sakit</SelectItem>
                                  <SelectItem value="alpha">Alpha</SelectItem>
                                  <SelectItem value="pengganti">
                                    Pengganti
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              {(currentStatus === "hadir" ||
                                currentStatus === "terlambat") && (
                                <Input
                                  type="datetime-local"
                                  value={currentWaktu}
                                  onChange={(e) =>
                                    handleChange(
                                      schedule.id,
                                      a.employee_id,
                                      "waktu_absen",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 w-full"
                                />
                              )}

                              {(currentStatus === "izin" ||
                                currentStatus === "sakit") && (
                                <Input
                                  value={currentCatatan}
                                  onChange={(e) =>
                                    handleChange(
                                      schedule.id,
                                      a.employee_id,
                                      "catatan",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Catatan..."
                                  className="h-8 w-full"
                                />
                              )}

                              <Button
                                size="sm"
                                className="w-full"
                                variant={
                                  existing && !changes ? "outline" : "default"
                                }
                                onClick={() =>
                                  handleSave(schedule.id, a.employee_id)
                                }
                                disabled={isSaving || !changes}
                              >
                                <Save className="mr-1 h-3 w-3" />
                                {isSaving
                                  ? "Menyimpan..."
                                  : existing && !changes
                                  ? "Tersimpan"
                                  : "Simpan"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
