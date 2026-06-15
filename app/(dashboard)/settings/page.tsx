"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, User, Shield, Mail, Calendar } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push("/login")
          return
        }

        const { data, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (fetchError) throw fetchError
        setProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat profil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, router])

  if (loading) return <LoadingState variant="skeleton" rows={4} />

  if (error) {
    return (
      <EmptyState
        icon={Settings}
        title="Gagal Memuat Pengaturan"
        description={error}
      />
    )
  }

  if (!profile) {
    return (
      <EmptyState
        icon={Settings}
        title="Profil Tidak Ditemukan"
        description="Silakan login kembali untuk mengakses pengaturan."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan</h2>
        <p className="text-sm text-muted-foreground">
          Kelola pengaturan akun Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Profil
          </CardTitle>
          <CardDescription>
            Informasi akun pengguna Anda saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nama Lengkap</p>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <div>
                {profile.role === "grand_admin" ? (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary">Petugas</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bergabung Sejak</p>
              <p className="font-medium">
                {new Date(profile.created_at).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Aplikasi
          </CardTitle>
          <CardDescription>
            Pengaturan umum aplikasi (segera hadir).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifikasi</p>
                <p className="text-sm text-muted-foreground">
                  Atur preferensi notifikasi aplikasi
                </p>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tampilan</p>
                <p className="text-sm text-muted-foreground">
                  Mode gelap/terang dan preferensi tampilan
                </p>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Keamanan</p>
                <p className="text-sm text-muted-foreground">
                  Ubah password dan pengaturan keamanan
                </p>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
