"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Search, RotateCcw, Users } from "lucide-react"
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
import { DataTable } from "@/components/shared/DataTable"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
  restoreEmployee,
} from "@/actions/employees"
import type { Employee } from "@/lib/types"

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterAktif, setFilterAktif] = useState<boolean | null>(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    nip: "",
    nama_lengkap: "",
    jabatan: "",
    unit_kerja: "",
    nomor_hp: "",
    email: "",
  })
  const [saving, setSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEmployees({
        search: search || undefined,
        status_aktif: filterAktif ?? undefined,
      })
      setEmployees(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data pegawai")
    } finally {
      setLoading(false)
    }
  }, [search, filterAktif])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateDialog = () => {
    setEditingEmployee(null)
    setFormData({ nip: "", nama_lengkap: "", jabatan: "", unit_kerja: "", nomor_hp: "", email: "" })
    setDialogOpen(true)
  }

  const openEditDialog = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormData({
      nip: emp.nip,
      nama_lengkap: emp.nama_lengkap,
      jabatan: emp.jabatan ?? "",
      unit_kerja: emp.unit_kerja ?? "",
      nomor_hp: emp.nomor_hp ?? "",
      email: emp.email ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nip || !formData.nama_lengkap) return
    try {
      setSaving(true)
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData)
      } else {
        await createEmployee(formData)
      }
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (emp: Employee) => {
    try {
      if (emp.status_aktif) {
        await softDeleteEmployee(emp.id)
      } else {
        await restoreEmployee(emp.id)
      }
      setDeleteConfirm(null)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status")
    }
  }

  const columns = [
    { key: "nip", label: "NIP" },
    { key: "nama_lengkap", label: "Nama Lengkap" },
    {
      key: "jabatan",
      label: "Jabatan",
      render: (item: Employee) => item.jabatan ?? "-",
    },
    {
      key: "unit_kerja",
      label: "Unit Kerja",
      render: (item: Employee) => item.unit_kerja ?? "-",
    },
    {
      key: "nomor_hp",
      label: "No. HP",
      render: (item: Employee) => item.nomor_hp ?? "-",
    },
    {
      key: "status_aktif",
      label: "Status",
      render: (item: Employee) => (
        <Badge variant={item.status_aktif ? "default" : "secondary"}>
          {item.status_aktif ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (item: Employee) => (
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
            onClick={() => setDeleteConfirm(item)}
          >
            {item.status_aktif ? (
              <Trash2 className="h-4 w-4 text-destructive" />
            ) : (
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      ),
    },
  ]

  if (loading && employees.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Pegawai</h2>
        </div>
        <LoadingState variant="skeleton" rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Pegawai</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pegawai
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari NIP, Nama, atau Unit Kerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterAktif === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAktif(filterAktif === true ? null : true)}
          >
            Aktif
          </Button>
          <Button
            variant={filterAktif === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAktif(filterAktif === false ? null : false)}
          >
            Nonaktif
          </Button>
        </div>
      </div>

      {employees.length === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title="Belum Ada Pegawai"
          description="Belum ada data pegawai. Tambahkan pegawai baru untuk memulai."
          action={{
            label: "Tambah Pegawai",
            onClick: openCreateDialog,
          }}
        />
      ) : (
        <div className="hidden md:block">
          <DataTable columns={columns} data={employees as any} loading={loading} />
        </div>
      )}

      {/* Mobile card view */}
      {employees.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {employees.map((emp) => (
            <div key={emp.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{emp.nama_lengkap}</p>
                  <p className="text-sm text-muted-foreground">{emp.nip}</p>
                </div>
                <Badge variant={emp.status_aktif ? "default" : "secondary"}>
                  {emp.status_aktif ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {emp.jabatan && <p>Jabatan: {emp.jabatan}</p>}
                {emp.unit_kerja && <p>Unit: {emp.unit_kerja}</p>}
                {emp.nomor_hp && <p>HP: {emp.nomor_hp}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(emp)}>
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(emp)}
                >
                  {emp.status_aktif ? (
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Pegawai" : "Tambah Pegawai"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Ubah data pegawai yang sudah ada."
                : "Isi data pegawai baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP *</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) =>
                    setFormData({ ...formData, nip: e.target.value })
                  }
                  placeholder="Nomor Induk Pegawai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                <Input
                  id="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_lengkap: e.target.value })
                  }
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input
                  id="jabatan"
                  value={formData.jabatan}
                  onChange={(e) =>
                    setFormData({ ...formData, jabatan: e.target.value })
                  }
                  placeholder="Jabatan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_kerja">Unit Kerja</Label>
                <Input
                  id="unit_kerja"
                  value={formData.unit_kerja}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_kerja: e.target.value })
                  }
                  placeholder="Unit kerja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor_hp">No. HP</Label>
                <Input
                  id="nomor_hp"
                  value={formData.nomor_hp}
                  onChange={(e) =>
                    setFormData({ ...formData, nomor_hp: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
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
            <Button onClick={handleSave} disabled={saving || !formData.nip || !formData.nama_lengkap}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm?.status_aktif
                ? "Nonaktifkan Pegawai"
                : "Aktifkan Pegawai"}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.status_aktif
                ? `Yakin ingin menonaktifkan ${deleteConfirm?.nama_lengkap}? Pegawai tidak akan muncul di penugasan.`
                : `Yakin ingin mengaktifkan kembali ${deleteConfirm?.nama_lengkap}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant={deleteConfirm?.status_aktif ? "destructive" : "default"}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {deleteConfirm?.status_aktif ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
