"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Download, FileSpreadsheet } from "lucide-react"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { getMonthlyRecap, getActivityRecap } from "@/actions/reports"
import type { MonthlyRecap, ActivityRecap } from "@/lib/types"
import * as XLSX from "xlsx"

export default function ReportsPage() {
  const router = useRouter()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [activeTab, setActiveTab] = useState("monthly")

  const [monthlyData, setMonthlyData] = useState<MonthlyRecap[]>([])
  const [activityData, setActivityData] = useState<ActivityRecap[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [monthly, activity] = await Promise.all([
        getMonthlyRecap(month, year),
        getActivityRecap(month, year),
      ])
      setMonthlyData(monthly)
      setActivityData(activity)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat rekap")
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleDateString("id-ID", { month: "long" }),
  }))

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  const exportMonthlyToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      monthlyData.map((r) => ({
        NIP: r.nip,
        Nama: r.nama_lengkap,
        Hadir: r.jumlah_hadir,
        Terlambat: r.jumlah_terlambat,
        Izin: r.jumlah_izin,
        Sakit: r.jumlah_sakit,
        Alpha: r.jumlah_alpha,
        Pengganti: r.jumlah_pengganti,
        "Total Penugasan": r.total_penugasan,
        "Persentase (%)": r.persentase_kehadiran,
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Bulanan")
    const bulan = months.find((m) => m.value === month)?.label ?? month
    XLSX.writeFile(wb, `Rekap_Bulanan_${bulan}_${year}.xlsx`)
  }

  const exportActivityToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      activityData.map((r) => ({
        Kegiatan: r.nama_kegiatan,
        Peserta: r.jumlah_peserta,
        Hadir: r.jumlah_hadir,
        Alpha: r.jumlah_alpha,
        "Persentase (%)": r.persentase_kehadiran,
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Kegiatan")
    const bulan = months.find((m) => m.value === month)?.label ?? month
    XLSX.writeFile(wb, `Rekap_Kegiatan_${bulan}_${year}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rekapitulasi</h2>
          <p className="text-sm text-muted-foreground">
            Laporan kehadiran pegawai
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <Label>Bulan</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
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
        <div className="space-y-1">
          <Label>Tahun</Label>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <Button variant="link" size="sm" onClick={() => setError(null)} className="ml-2">
            Tutup
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="monthly">Rekap Bulanan</TabsTrigger>
          <TabsTrigger value="activity">Rekap Per Kegiatan</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {monthlyData.length} pegawai
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMonthlyToExcel}
              disabled={monthlyData.length === 0}
            >
              <Download className="mr-1 h-3 w-3" />
              Export Excel
            </Button>
          </div>

          {loading ? (
            <LoadingState variant="skeleton" rows={6} />
          ) : monthlyData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum Ada Data Rekap"
              description="Belum ada data kehadiran untuk bulan ini."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          NIP
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Nama
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Hadir
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Terlambat
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Izin
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Sakit
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Alpha
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Pengganti
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          Total
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((r) => (
                        <tr
                          key={r.employee_id}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="px-3 py-2">{r.nip}</td>
                          <td className="px-3 py-2 font-medium">
                            {r.nama_lengkap}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.jumlah_hadir}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.jumlah_terlambat}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.jumlah_izin}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.jumlah_sakit}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.jumlah_alpha}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.jumlah_pengganti}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r.total_penugasan}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant={
                                r.persentase_kehadiran >= 75
                                  ? "default"
                                  : r.persentase_kehadiran >= 50
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {r.persentase_kehadiran}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {monthlyData.map((r) => (
                  <Card key={r.employee_id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{r.nama_lengkap}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.nip}
                          </p>
                        </div>
                        <Badge
                          variant={
                            r.persentase_kehadiran >= 75
                              ? "default"
                              : r.persentase_kehadiran >= 50
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {r.persentase_kehadiran}%
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded bg-emerald-50 p-1 dark:bg-emerald-950">
                          <p className="font-semibold text-emerald-600">
                            {r.jumlah_hadir}
                          </p>
                          <p className="text-xs text-muted-foreground">Hadir</p>
                        </div>
                        <div className="rounded bg-yellow-50 p-1 dark:bg-yellow-950">
                          <p className="font-semibold text-yellow-600">
                            {r.jumlah_terlambat}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Terlambat
                          </p>
                        </div>
                        <div className="rounded bg-blue-50 p-1 dark:bg-blue-950">
                          <p className="font-semibold text-blue-600">
                            {r.jumlah_izin}
                          </p>
                          <p className="text-xs text-muted-foreground">Izin</p>
                        </div>
                        <div className="rounded bg-blue-50 p-1 dark:bg-blue-950">
                          <p className="font-semibold text-blue-600">
                            {r.jumlah_sakit}
                          </p>
                          <p className="text-xs text-muted-foreground">Sakit</p>
                        </div>
                        <div className="rounded bg-red-50 p-1 dark:bg-red-950">
                          <p className="font-semibold text-red-600">
                            {r.jumlah_alpha}
                          </p>
                          <p className="text-xs text-muted-foreground">Alpha</p>
                        </div>
                        <div className="rounded bg-purple-50 p-1 dark:bg-purple-950">
                          <p className="font-semibold text-purple-600">
                            {r.jumlah_pengganti}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pengganti
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {activityData.length} kegiatan
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={exportActivityToExcel}
              disabled={activityData.length === 0}
            >
              <Download className="mr-1 h-3 w-3" />
              Export Excel
            </Button>
          </div>

          {loading ? (
            <LoadingState variant="skeleton" rows={6} />
          ) : activityData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum Ada Data Rekap Kegiatan"
              description="Belum ada data kehadiran untuk kegiatan di bulan ini."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Kegiatan
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Peserta
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Hadir
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Alpha
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Persentase
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityData.map((r) => (
                        <tr
                          key={r.activity_id}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="px-4 py-2 font-medium">
                            {r.nama_kegiatan}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {r.jumlah_peserta}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {r.jumlah_hadir}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {r.jumlah_alpha}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Badge
                              variant={
                                r.persentase_kehadiran >= 75
                                  ? "default"
                                  : r.persentase_kehadiran >= 50
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {r.persentase_kehadiran}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {activityData.map((r) => (
                  <Card key={r.activity_id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{r.nama_kegiatan}</p>
                        <Badge
                          variant={
                            r.persentase_kehadiran >= 75
                              ? "default"
                              : r.persentase_kehadiran >= 50
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {r.persentase_kehadiran}%
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded bg-muted p-1">
                          <p className="font-semibold">{r.jumlah_peserta}</p>
                          <p className="text-xs text-muted-foreground">
                            Peserta
                          </p>
                        </div>
                        <div className="rounded bg-emerald-50 p-1 dark:bg-emerald-950">
                          <p className="font-semibold text-emerald-600">
                            {r.jumlah_hadir}
                          </p>
                          <p className="text-xs text-muted-foreground">Hadir</p>
                        </div>
                        <div className="rounded bg-red-50 p-1 dark:bg-red-950">
                          <p className="font-semibold text-red-600">
                            {r.jumlah_alpha}
                          </p>
                          <p className="text-xs text-muted-foreground">Alpha</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
