"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface DashboardData {
  totalPegawaiAktif: number
  totalKegiatanBulanIni: number
  totalJadwalBulanIni: number
  kehadiranHariIni: number
  persentaseKehadiranBulanIni: number
  chartData: { label: string; hadir: number; alpha: number }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      const today = now.toISOString().split("T")[0]
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`
      const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0]

      const [
        { count: totalPegawai },
        { count: totalKegiatan },
        { data: jadwalBulanIni },
        { data: attendanceToday },
        { data: attendanceMonth },
      ] = await Promise.all([
        supabase
          .from("employees")
          .select("*", { count: "exact", head: true })
          .eq("status_aktif", true),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("aktif", true),
        supabase
          .from("activity_schedules")
          .select("id")
          .gte("tanggal", startOfMonth)
          .lte("tanggal", endOfMonth),
        supabase
          .from("attendance")
          .select("*, schedule:activity_schedules!inner(tanggal)")
          .eq("schedule.tanggal", today),
        supabase
          .from("attendance")
          .select("*, schedule:activity_schedules!inner(tanggal)")
          .gte("schedule.tanggal", startOfMonth)
          .lte("schedule.tanggal", endOfMonth),
      ])

      const totalJadwal = jadwalBulanIni?.length ?? 0
      const kehadiranHariIni = attendanceToday?.length ?? 0
      const totalAttendanceMonth = attendanceMonth?.length ?? 0
      const hadirBulanIni =
        attendanceMonth?.filter(
          (a) => a.status === "hadir" || a.status === "terlambat"
        ).length ?? 0
      const persentase =
        totalAttendanceMonth > 0
          ? Math.round((hadirBulanIni / totalAttendanceMonth) * 100)
          : 0

      // Build chart data for last 6 months
      const chartData: { label: string; hadir: number; alpha: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1)
        const m = d.getMonth() + 1
        const y = d.getFullYear()
        const s = `${y}-${String(m).padStart(2, "0")}-01`
        const e = new Date(y, m, 0).toISOString().split("T")[0]
        const bulan = d.toLocaleDateString("id-ID", {
          month: "short",
          year: "numeric",
        })

        const { data: att } = await supabase
          .from("attendance")
          .select("status, schedule:activity_schedules!inner(tanggal)")
          .gte("schedule.tanggal", s)
          .lte("schedule.tanggal", e)

        chartData.push({
          label: bulan,
          hadir:
            att?.filter((a) => a.status === "hadir" || a.status === "terlambat")
              .length ?? 0,
          alpha: att?.filter((a) => a.status === "alpha").length ?? 0,
        })
      }

      setData({
        totalPegawaiAktif: totalPegawai ?? 0,
        totalKegiatanBulanIni: totalKegiatan ?? 0,
        totalJadwalBulanIni: totalJadwal,
        kehadiranHariIni: kehadiranHariIni,
        persentaseKehadiranBulanIni: persentase,
        chartData,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data dashboard")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) return <LoadingState variant="skeleton" rows={6} />

  if (error) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Gagal Memuat Data"
        description={error}
        action={{
          label: "Coba Lagi",
          onClick: () => fetchDashboard(),
        }}
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Belum Ada Data"
        description="Belum ada data dashboard yang tersedia."
      />
    )
  }

  const maxChartValue = Math.max(
    ...data.chartData.flatMap((d) => [d.hadir, d.alpha]),
    1
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Pegawai Aktif"
          value={data.totalPegawaiAktif}
          icon={Users}
          description="Seluruh pegawai aktif"
        />
        <StatCard
          title="Kegiatan Bulan Ini"
          value={data.totalKegiatanBulanIni}
          icon={CalendarCheck}
          description="Kegiatan aktif"
        />
        <StatCard
          title="Jadwal Bulan Ini"
          value={data.totalJadwalBulanIni}
          icon={CalendarDays}
          description="Total jadwal"
        />
        <StatCard
          title="Kehadiran Hari Ini"
          value={data.kehadiranHariIni}
          icon={ClipboardCheck}
          description="Absen hari ini"
        />
        <StatCard
          title="Persentase Kehadiran"
          value={`${data.persentaseKehadiranBulanIni}%`}
          icon={TrendingUp}
          trend={{
            value: data.persentaseKehadiranBulanIni,
            positive: data.persentaseKehadiranBulanIni >= 75,
          }}
          description="Bulan ini"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tren Kehadiran 6 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {data.chartData.length === 0 ? (
            <EmptyState
              title="Belum Ada Data Grafik"
              description="Data grafik kehadiran belum tersedia."
            />
          ) : (
            <div className="space-y-4">
              {data.chartData.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.hadir} hadir / {item.alpha} alpha
                    </span>
                  </div>
                  <div className="flex h-5 gap-0.5 overflow-hidden rounded-md">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(item.hadir / maxChartValue) * 100}%`,
                      }}
                      title={`Hadir: ${item.hadir}`}
                    />
                    <div
                      className="bg-red-400 transition-all duration-500"
                      style={{
                        width: `${(item.alpha / maxChartValue) * 100}%`,
                      }}
                      title={`Alpha: ${item.alpha}`}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
                      Hadir
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-sm bg-red-400" />
                      Alpha
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
