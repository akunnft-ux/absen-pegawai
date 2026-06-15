"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, RotateCcw, Search, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import {
  getActivities,
  createActivity,
  updateActivity,
  toggleActivity,
} from "@/actions/activities"
import type { Activity } from "@/lib/types"

export default function ActivitiesPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    nama_kegiatan: "",
    deskripsi: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getActivities({ search: search || undefined })
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data kegiatan")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateDialog = () => {
    setEditingActivity(null)
    setFormData({ nama_kegiatan: "", deskripsi: "" })
    setDialogOpen(true)
  }

  const openEditDialog = (act: Activity) => {
    setEditingActivity(act)
    setFormData({
      nama_kegiatan: act.nama_kegiatan,
      deskripsi: act.deskripsi ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nama_kegiatan) return
    try {
      setSaving(true)
      if (editingActivity) {
        await updateActivity(editingActivity.id, formData)
      } else {
        await createActivity(formData)
      }
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (act: Activity) => {
    try {
      await toggleActivity(act.id, !act.aktif)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status")
    }
  }

  const columns = [
    { key: "nama_kegiatan", label: "Nama Kegiatan" },
    {
      key: "deskripsi",
      label: "Deskripsi",
      render: (item: Activity) => (
        <span className="line-clamp-1 max-w-xs">{item.deskripsi ?? "-"}</span>
      ),
    },
    {
      key: "created_at",
      label: "Dibuat",
      render: (item: Activity) =>
        new Date(item.created_at).toLocaleDateString("id-ID"),
    },
    {
      key: "aktif",
      label: "Status",
      render: (item: Activity) => (
        <Badge variant={item.aktif ? "default" : "secondary"}>
          {item.aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (item: Activity) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggle(item)}
          >
            {item.aktif ? (
              <Trash2 className="h-4 w-4 text-destructive" />
            ) : (
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      ),
    },
  ]

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Kegiatan</h2>
        </div>
        <LoadingState variant="skeleton" rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Kegiatan</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kegiatan
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama kegiatan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {activities.length === 0 && !loading ? (
        <EmptyState
          icon={CalendarCheck}
          title="Belum Ada Kegiatan"
          description="Belum ada data kegiatan. Tambahkan kegiatan baru untuk memulai."
          action={{
            label: "Tambah Kegiatan",
            onClick: openCreateDialog,
          }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable columns={columns} data={activities as any} loading={loading} />
          </div>
          <div className="grid gap-3 md:hidden">
            {activities.map((act) => (
              <div key={act.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{act.nama_kegiatan}</p>
                    {act.deskripsi && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {act.deskripsi}
                      </p>
                    )}
                  </div>
                  <Badge variant={act.aktif ? "default" : "secondary"}>
                    {act.aktif ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(act)}>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggle(act)}>
                    {act.aktif ? (
                      <>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Nonaktifkan
                      </>
                    ) : (
                      <>
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Aktifkan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Edit Kegiatan" : "Tambah Kegiatan"}
            </DialogTitle>
            <DialogDescription>
              {editingActivity
                ? "Ubah data kegiatan yang sudah ada."
                : "Isi data kegiatan baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama_kegiatan">Nama Kegiatan *</Label>
              <Input
                id="nama_kegiatan"
                value={formData.nama_kegiatan}
                onChange={(e) =>
                  setFormData({ ...formData, nama_kegiatan: e.target.value })
                }
                placeholder="Nama kegiatan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsi: e.target.value })
                }
                placeholder="Deskripsi kegiatan (opsional)"
                rows={3}
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
              disabled={saving || !formData.nama_kegiatan}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
