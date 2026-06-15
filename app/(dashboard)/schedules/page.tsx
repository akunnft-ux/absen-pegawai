"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, CalendarDays, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { getSchedules, createSchedule } from "@/actions/schedules"
import { getActivities } from "@/actions/activities"
import type { ActivitySchedule, Activity, ScheduleStatus } from "@/lib/types"

const statusBadge: Record<ScheduleStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export default function SchedulesPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<ActivitySchedule[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear] = useState(now.getFullYear())
  const [filterActivity, setFilterActivity] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    activity_id: "",
    tanggal: "",
    jam_mulai: "",
    jam_selesai: "",
    lokasi: "",
    keterangan: "",
    status: "draft" as ScheduleStatus,
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [scheduleData, activityData] = await Promise.all([
        getSchedules({
          month: filterMonth,
          year: filterYear,
          activity_id: filterActivity || undefined,
        }),
        getActivities({ aktif: true }),
      ])
      setSchedules(scheduleData)
      setActivities(activityData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data jadwal")
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterYear, filterActivity])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateDialog = () => {
    setFormData({
      activity_id: activities[0]?.id ?? "",
      tanggal: "",
      jam_mulai: "",
      jam_selesai: "",
      lokasi: "",
      keterangan: "",
      status: "draft",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.activity_id || !formData.tanggal || !formData.jam_mulai || !formData.jam_selesai) return
    try {
      setSaving(true)
      await createSchedule(formData)
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jadwal")
    } finally {
      setSaving(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleDateString("id-ID", { month: "long" }),
  }))

  const columns = [
    {
      key: "activity",
      label: "Kegiatan",
      render: (item: ActivitySchedule) => item.activity?.nama_kegiatan ?? "-",
    },
    {
      key: "tanggal",
      label: "Tanggal",
      render: (item: ActivitySchedule) =>
        new Date(item.tanggal).toLocaleDateString("id-ID"),
    },
    {
      key: "jam_mulai",
      label: "Jam",
      render: (item: ActivitySchedule) =>
        `${item.jam_mulai.slice(0, 5)} - ${item.jam_selesai.slice(0, 5)}`,
    },
    {
      key: "lokasi",
      label: "Lokasi",
      render: (item: ActivitySchedule) => item.lokasi ?? "-",
    },
    {
      key: "status",
      label: "Status",
      render: (item: ActivitySchedule) => {
        const badge = statusBadge[item.status] ?? statusBadge.draft
        return <Badge variant={badge.variant}>{badge.label}</Badge>
      },
    },
    {
      key: "actions",
      label: "Aksi",
      render: (item: ActivitySchedule) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/schedules/${item.id}`)}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Detail
        </Button>
      ),
    },
  ]

  if (loading && schedules.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Jadwal</h2>
        </div>
        <LoadingState variant="skeleton" rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Jadwal</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jadwal
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-48">
          <Select
            value={String(filterMonth)}
            onValueChange={(v) => setFilterMonth(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={filterActivity}
            onValueChange={setFilterActivity}
          >
            <SelectTrigger>
              <SelectValue placeholder="Semua Kegiatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kegiatan</SelectItem>
              {activities.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nama_kegiatan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {schedules.length === 0 && !loading ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum Ada Jadwal"
          description="Belum ada jadwal untuk bulan ini. Buat jadwal baru untuk memulai."
          action={{
            label: "Tambah Jadwal",
            onClick: openCreateDialog,
          }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable columns={columns} data={schedules as any} loading={loading} />
          </div>
          <div className="grid gap-3 md:hidden">
            {schedules.map((sched) => {
              const badge = statusBadge[sched.status] ?? statusBadge.draft
              return (
                <div
                  key={sched.id}
                  className="rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/schedules/${sched.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {sched.activity?.nama_kegiatan ?? "Kegiatan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sched.tanggal).toLocaleDateString("id-ID")} |{" "}
                        {sched.jam_mulai.slice(0, 5)} - {sched.jam_selesai.slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  {sched.lokasi && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sched.lokasi}
                    </p>
                  )}
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Detail
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal</DialogTitle>
            <DialogDescription>Buat jadwal kegiatan baru.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activity">Kegiatan *</Label>
              <Select
                value={formData.activity_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, activity_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kegiatan" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nama_kegiatan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal *</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jam_mulai">Jam Mulai *</Label>
                <Input
                  id="jam_mulai"
                  type="time"
                  value={formData.jam_mulai}
                  onChange={(e) =>
                    setFormData({ ...formData, jam_mulai: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jam_selesai">Jam Selesai *</Label>
                <Input
                  id="jam_selesai"
                  type="time"
                  value={formData.jam_selesai}
                  onChange={(e) =>
                    setFormData({ ...formData, jam_selesai: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) =>
                  setFormData({ ...formData, lokasi: e.target.value })
                }
                placeholder="Lokasi kegiatan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v: ScheduleStatus) =>
                  setFormData({ ...formData, status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !formData.activity_id ||
                !formData.tanggal ||
                !formData.jam_mulai ||
                !formData.jam_selesai
              }
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
