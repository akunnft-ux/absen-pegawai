"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Shield, Plus, Trash2 } from "lucide-react"
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
import { getUsers, createUser, updateUserRole, deleteUser } from "@/actions/users"
import type { User, UserRole } from "@/lib/types"

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "petugas" as UserRole,
  })
  const [saving, setSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.full_name) return
    try {
      setSaving(true)
      await createUser(formData)
      setDialogOpen(false)
      setFormData({ email: "", password: "", full_name: "", role: "petugas" })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat user")
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah role")
    }
  }

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id)
      setDeleteConfirm(null)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus user")
    }
  }

  const roleBadge = (role: UserRole) => {
    if (role === "grand_admin") {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Admin</Badge>
    }
    return <Badge variant="secondary">Petugas</Badge>
  }

  const columns = [
    { key: "full_name", label: "Nama" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (item: User) => roleBadge(item.role),
    },
    {
      key: "created_at",
      label: "Dibuat",
      render: (item: User) =>
        new Date(item.created_at).toLocaleDateString("id-ID"),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (item: User) => (
        <div className="flex items-center gap-2">
          <Select
            value={item.role}
            onValueChange={(v: UserRole) => handleRoleChange(item.id, v)}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="petugas">Petugas</SelectItem>
              <SelectItem value="grand_admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirm(item)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        </div>
        <LoadingState variant="skeleton" rows={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            Kelola pengguna aplikasi
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
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

      {users.length === 0 && !loading ? (
        <EmptyState
          icon={Shield}
          title="Belum Ada User"
          description="Belum ada pengguna terdaftar."
          action={{
            label: "Tambah User",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable columns={columns} data={users as any} loading={loading} />
          </div>
          <div className="grid gap-3 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  {roleBadge(user.role)}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Select
                    value={user.role}
                    onValueChange={(v: UserRole) =>
                      handleRoleChange(user.id, v)
                    }
                  >
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petugas">Petugas</SelectItem>
                      <SelectItem value="grand_admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm(user)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru untuk aplikasi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v: UserRole) =>
                  setFormData({ ...formData, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petugas">Petugas</SelectItem>
                  <SelectItem value="grand_admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={handleCreate}
              disabled={
                saving ||
                !formData.email ||
                !formData.password ||
                !formData.full_name
              }
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus user {deleteConfirm?.full_name} (
              {deleteConfirm?.email})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
