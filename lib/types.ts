export type UserRole = 'grand_admin' | 'petugas'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  nip: string
  nama_lengkap: string
  jabatan: string | null
  unit_kerja: string | null
  nomor_hp: string | null
  email: string | null
  status_aktif: boolean
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  nama_kegiatan: string
  deskripsi: string | null
  aktif: boolean
  created_at: string
  updated_at: string
}

export type ScheduleStatus = 'draft' | 'published' | 'completed' | 'cancelled'

export interface ActivitySchedule {
  id: string
  activity_id: string
  tanggal: string
  jam_mulai: string
  jam_selesai: string
  lokasi: string | null
  keterangan: string | null
  status: ScheduleStatus
  created_at: string
  updated_at: string
  // Joined fields
  activity?: Activity
  assignments?: DutyAssignment[]
}

export interface DutyAssignment {
  id: string
  schedule_id: string
  employee_id: string
  wajib_hadir: boolean
  catatan: string | null
  created_at: string
  // Joined fields
  employee?: Employee
}

export type AttendanceStatus = 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpha' | 'pengganti'

export interface Attendance {
  id: string
  schedule_id: string
  employee_id: string
  status: AttendanceStatus
  waktu_absen: string | null
  catatan: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  employee?: Employee
  schedule?: ActivitySchedule
}

export interface MonthlyRecap {
  employee_id: string
  nama_lengkap: string
  nip: string
  jumlah_hadir: number
  jumlah_terlambat: number
  jumlah_izin: number
  jumlah_sakit: number
  jumlah_alpha: number
  jumlah_pengganti: number
  total_penugasan: number
  persentase_kehadiran: number
}

export interface ActivityRecap {
  activity_id: string
  nama_kegiatan: string
  jumlah_peserta: number
  jumlah_hadir: number
  jumlah_alpha: number
  persentase_kehadiran: number
}
