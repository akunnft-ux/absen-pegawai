"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Save, UserCheck, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { getScheduleById, updateSchedule } from "@/actions/schedules"
import {
  getAssignmentsBySchedule,
  createAssignment,
  updateAssignment,
  removeAssignment,
  getAvailableEmployeesForSchedule,
} from "@/actions/assignments"
import {
  getAttendanceBySchedule,
  upsertAttendance,
} from "@/actions/attendance"
import { useAuth } from "@/hooks/useAuth"
import type {
  ActivitySchedule,
  DutyAssignment,
  Attendance,
  AttendanceStatus,
  ScheduleStatus,
} from "@/lib/types"

const statusBadge: Record<ScheduleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

const attendanceBadge: Record<AttendanceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  hadir: { label: "Hadir", variant: "default" },
  terlambat: { label: "Terlambat", variant: "secondary" },
  izin: { label: "Izin", variant: "outline" },
  sakit: { label: "Sakit", variant: "outline" },
  alpha: { label: "Alpha", variant: "destructive" },
  pengganti: { label: "Pengganti", variant: "default" },
}

export default function ScheduleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const scheduleId = params.id as string

  const [schedule, setSchedule] = useState<ActivitySchedule | null>(null)
  const [assignments, setAssignments] = useState<DutyAssignment[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("assignments")

  // Assignments state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<
    { id: string; nama_lengkap: string; nip: string }[]
  >([])
  const [selectedEmployee, setSelectedEmployee] = useState("")

  // Attendance state
  const [attendanceChanges, setAttendanceChanges] = useState<
    Record<string, { status: AttendanceStatus; catatan: string; waktu_absen: string }>
  >({})
  const [savingAttendance, setSavingAttendance] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [scheduleData, assignmentData, attendanceData] = await Promise.all([
        getScheduleById(scheduleId),
        getAssignmentsBySchedule(scheduleId),
        getAttendanceBySchedule(scheduleId),
      ])
      setSchedule(scheduleData)
      setAssignments(assignmentData)
      setAttendance(attendanceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddEmployee = async () => {
    if (!selectedEmployee) return
    try {
      await createAssignment({
        schedule_id: scheduleId,
        employee_id: selectedEmployee,
        wajib_hadir: false,
      })
      setSelectedEmployee("")
      setAddDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan petugas")
    }
  }

  const handleRemoveAssignment = async (id: string) => {
    try {
      await removeAssignment(id)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus penugasan")
    }
  }

  const handleToggleWajibHadir = async (assignment: DutyAssignment) => {
    try {
      await updateAssignment(assignment.id, {
        wajib_hadir: !assignment.wajib_hadir,
      })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate penugasan")
    }
  }

  const handleAttendanceChange = (
    employeeId: string,
    field: "status" | "catatan" | "waktu_absen",
    value: string
  ) => {
    setAttendanceChanges((prev) => ({
      ...prev,
      [employeeId]: {
        status: (field === "status" ? value : prev[employeeId]?.status ?? "hadir") as AttendanceStatus,
        catatan: field === "catatan" ? value : prev[employeeId]?.catatan ?? "",
        waktu_absen: field === "waktu_absen" ? value : prev[employeeId]?.waktu_absen ?? new Date().toISOString().slice(0, 16),
      },
    }))
  }

  const handleSaveAttendance = async (employeeId: string) => {
    const change = attendanceChanges[employeeId]
    if (!change) return
    try {
      setSavingAttendance((prev) => ({ ...prev, [employeeId]: true }))
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
        created_by: profile?.id,
      })
      setAttendanceChanges((prev) => {
        const next = { ...prev }
        delete next[employeeId]
        return next
      })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan absensi")
    } finally {
      setSavingAttendance((prev) => ({ ...prev, [employeeId]: false }))
    }
  }

  const getAttendanceStatusForEmployee = (employeeId: string): Attendance | undefined => {
    return attendance.find((a) => a.employee_id === employeeId)
  }

  const openAddDialog = async () => {
    try {
      const employees = await getAvailableEmployeesForSchedule(scheduleId)
      setAvailableEmployees(employees)
      setSelectedEmployee(employees[0]?.id ?? "")
      setAddDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data pegawai")
    }
  }

  if (loading) return <LoadingState variant="skeleton" rows={8} />

  if (error && !schedule) {
    return (
      <EmptyState
        title="Gagal Memuat Data"
        description={error}
        action={{
          label: "Kembali",
          onClick: () => router.push("/schedules"),
        }}
      />
    )
  }

  if (!schedule) {
    return (
      <EmptyState
        title="Jadwal Tidak Ditemukan"
        description="Jadwal yang Anda cari tidak ditemukan."
        action={{
          label: "Kembali ke Jadwal",
          onClick: () => router.push("/schedules"),
        }}
      />
    )
  }

  const badge = statusBadge[schedule.status] ?? statusBadge.draft

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/schedules")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Detail Jadwal
          </h2>
          <p className="text-sm text-muted-foreground">
            {schedule.activity?.nama_kegiatan ?? "Kegiatan"} -{" "}
            {new Date(schedule.tanggal).toLocaleDateString("id-ID")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Kegiatan</Label>
              <p className="font-medium">
                {schedule.activity?.nama_kegiatan ?? "-"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal</Label>
              <p className="font-medium">
                {new Date(schedule.tanggal).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Jam</Label>
              <p className="font-medium">
                {schedule.jam_mulai.slice(0, 5)} -{" "}
                {schedule.jam_selesai.slice(0, 5)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Lokasi</Label>
              <p className="font-medium">{schedule.lokasi ?? "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-0.5">
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Keterangan</Label>
              <p className="font-medium">{schedule.keterangan ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assignments" className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            Penugasan
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4" />
            Absensi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total {assignments.length} petugas ditugaskan
            </p>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-1 h-3 w-3" />
              Tambah Petugas
            </Button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Belum Ada Penugasan"
              description="Belum ada petugas yang ditugaskan untuk jadwal ini."
              action={{
                label: "Tambah Petugas",
                onClick: openAddDialog,
              }}
            />
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={a.wajib_hadir}
                      onCheckedChange={() => handleToggleWajibHadir(a)}
                      id={`wajib-${a.id}`}
                    />
                    <div>
                      <label
                        htmlFor={`wajib-${a.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {a.employee?.nama_lengkap ?? "Pegawai"}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {a.employee?.nip ?? "-"}
                        {a.wajib_hadir && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Wajib Hadir
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAssignment(a.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Belum Ada Penugasan"
              description="Tambahkan petugas terlebih dahulu untuk mencatat absensi."
            />
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const existing = getAttendanceStatusForEmployee(a.employee_id)
                const changes = attendanceChanges[a.employee_id]
                const currentStatus = changes?.status ?? existing?.status
                const currentCatatan =
                  changes?.catatan ?? existing?.catatan ?? ""
                const currentWaktu =
                  changes?.waktu_absen ??
                  existing?.waktu_absen ??
                  new Date().toISOString().slice(0, 16)
                const isSaving = savingAttendance[a.employee_id]

                return (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {a.employee?.nama_lengkap ?? "Pegawai"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {a.employee?.nip ?? "-"}
                          </p>
                          {existing && (
                            <span className="mt-1 inline-block">
                              <Badge
                                variant={
                                  attendanceBadge[existing.status]?.variant ??
                                  "secondary"
                                }
                              >
                                {attendanceBadge[existing.status]?.label ??
                                  existing.status}
                              </Badge>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <div className="space-y-1">
                            <Label className="text-xs">Status</Label>
                            <Select
                              value={currentStatus ?? "hadir"}
                              onValueChange={(v) =>
                                handleAttendanceChange(
                                  a.employee_id,
                                  "status",
                                  v
                                )
                              }
                            >
                              <SelectTrigger className="h-8 w-36">
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
                          </div>

                          {(currentStatus === "hadir" ||
                            currentStatus === "terlambat") && (
                            <div className="space-y-1">
                              <Label className="text-xs">Waktu</Label>
                              <Input
                                type="datetime-local"
                                value={currentWaktu}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    a.employee_id,
                                    "waktu_absen",
                                    e.target.value
                                  )
                                }
                                className="h-8 w-44"
                              />
                            </div>
                          )}

                          {(currentStatus === "izin" ||
                            currentStatus === "sakit") && (
                            <div className="space-y-1">
                              <Label className="text-xs">Catatan</Label>
                              <Input
                                value={currentCatatan}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    a.employee_id,
                                    "catatan",
                                    e.target.value
                                  )
                                }
                                placeholder="Alasan izin/sakit"
                                className="h-8 w-44"
                              />
                            </div>
                          )}

                          <Button
                            size="sm"
                            onClick={() =>
                              handleSaveAttendance(a.employee_id)
                            }
                            disabled={isSaving || !changes}
                            className="h-8"
                          >
                            <Save className="mr-1 h-3 w-3" />
                            {isSaving ? "..." : "Simpan"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Petugas</DialogTitle>
            <DialogDescription>
              Pilih pegawai untuk ditugaskan pada jadwal ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Semua pegawai sudah ditugaskan.
              </p>
            ) : (
              <div className="space-y-2">
                <Label>Pilih Pegawai</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nama_lengkap} ({emp.nip})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddEmployee}
              disabled={!selectedEmployee || availableEmployees.length === 0}
            >
              Tambah
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <Button variant="link" size="sm" onClick={() => setError(null)} className="ml-2">
            Tutup
          </Button>
        </div>
      )}
    </div>
  )
}
