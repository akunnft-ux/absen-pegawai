# PRD - Sistem Manajemen Kehadiran Kegiatan Pegawai

## 1. Informasi Umum

### Nama Produk

Sistem Manajemen Kehadiran Kegiatan Pegawai

### Versi

v1.0

### Tujuan

Membangun aplikasi web untuk mengelola:

* Data pegawai
* Data kegiatan
* Jadwal kegiatan
* Penugasan/piket pegawai
* Kehadiran pegawai pada kegiatan
* Rekapitulasi kehadiran
* Export laporan Excel

Sistem harus mobile friendly dan dapat digunakan oleh admin maupun petugas absensi.

---

# 2. Tech Stack

## Frontend

* Next.js 15
* App Router
* TypeScript
* Tailwind CSS
* shadcn/ui

## Backend

* Supabase

### Service yang digunakan

* PostgreSQL Database
* Supabase Auth
* Row Level Security (RLS)
* Storage (opsional)

## Hosting

* Vercel

## Export

* SheetJS (xlsx)

---

# 3. User Roles

## Grand Admin

Akses penuh.

Hak akses:

* CRUD User
* CRUD Pegawai
* CRUD Kegiatan
* CRUD Jadwal Kegiatan
* CRUD Penugasan Pegawai
* CRUD Absensi
* Melihat seluruh laporan
* Export laporan
* Mengubah status data
* Menghapus data

---

## Petugas

Hak akses:

* Login
* Melihat data pegawai
* Melihat jadwal kegiatan
* Input absensi
* Edit absensi

Tidak dapat:

* Menghapus data master
* Menambah user
* Mengubah role

---

# 4. Modul Sistem

## Modul Authentication

### Login

Field:

* Email
* Password

Validasi:

* Email wajib
* Password wajib

Session:

* Menggunakan Supabase Auth

Redirect:

Admin:

* /dashboard

Petugas:

* /attendance

---

## Modul Dashboard

Card statistik:

* Total Pegawai Aktif
* Total Kegiatan Bulan Ini
* Total Jadwal Bulan Ini
* Kehadiran Hari Ini
* Persentase Kehadiran Bulan Ini

Chart:

* Kehadiran per bulan
* Kehadiran per kegiatan

---

# 5. Modul Pegawai

## Data Pegawai

Field:

id UUID

nip VARCHAR(50)

nama_lengkap VARCHAR(255)

jabatan VARCHAR(255)

unit_kerja VARCHAR(255)

nomor_hp VARCHAR(50)

email VARCHAR(255)

status_aktif BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP

---

## Rules

NIP unik.

Pegawai nonaktif:

* Tidak muncul pada penugasan baru.
* Tetap muncul pada histori.

---

## Fitur

### List

Pencarian:

* NIP
* Nama
* Unit Kerja

Filter:

* Aktif
* Nonaktif

---

### Create

Field wajib:

* NIP
* Nama

---

### Edit

Semua field dapat diubah.

---

### Delete

Soft delete.

status_aktif = false

---

# 6. Modul Kegiatan

## Master Kegiatan

Contoh:

* Rapat Bulanan
* Survey Lapangan
* Pelatihan
* Sosialisasi
* Monitoring

Field:

id UUID

nama_kegiatan

deskripsi

aktif

created_at

updated_at

---

Rules:

Nama kegiatan harus unik.

---

# 7. Modul Jadwal Kegiatan

Satu kegiatan dapat memiliki banyak jadwal.

Contoh:

Rapat Bulanan

Tanggal:
15 Juni 2026

Jam:
08:00 - 10:00

Lokasi:
Aula Utama

---

Field

id UUID

activity_id UUID

tanggal DATE

jam_mulai TIME

jam_selesai TIME

lokasi TEXT

keterangan TEXT

status

created_at

updated_at

---

Status:

draft

published

completed

cancelled

---

Validasi

jam_selesai harus lebih besar dari jam_mulai

tanggal tidak boleh kosong

---

# 8. Modul Penugasan Pegawai

Tujuan:

Menentukan pegawai yang wajib hadir pada suatu kegiatan.

Field

id UUID

schedule_id UUID

employee_id UUID

wajib_hadir BOOLEAN

catatan TEXT

created_at

---

Rules

Satu pegawai tidak boleh ditugaskan dua kali pada jadwal yang sama.

Unique:

schedule_id + employee_id

---

# 9. Modul Absensi

Status Absensi

* Hadir
* Terlambat
* Izin
* Sakit
* Alpha
* Pengganti

---

Field

id UUID

schedule_id UUID

employee_id UUID

status

waktu_absen

catatan

created_by

created_at

updated_at

---

Business Rules

Jika pegawai tidak memiliki record absensi saat kegiatan selesai:

status otomatis Alpha

---

Jika status:

Hadir

maka:

waktu_absen wajib ada

---

Jika status:

Izin

Sakit

maka:

catatan wajib diisi

---

# 10. Rekap Kehadiran

## Rekap Bulanan

Per pegawai.

Menampilkan:

Nama

Jumlah Hadir

Jumlah Terlambat

Jumlah Izin

Jumlah Sakit

Jumlah Alpha

Jumlah Pengganti

Persentase Kehadiran

---

Formula

Persentase Kehadiran

(Hadir + Terlambat) / Total Penugasan × 100

---

## Rekap Kegiatan

Menampilkan:

Nama Kegiatan

Jumlah Peserta

Jumlah Hadir

Jumlah Alpha

Persentase Kehadiran

---

# 11. Export Excel

Format:

xlsx

Menu:

* Rekap Bulanan
* Rekap Tahunan
* Rekap Per Kegiatan
* Rekap Per Pegawai

Nama file:

rekap-pegawai-2026-06.xlsx

rekap-kegiatan-2026.xlsx

---

# 12. Database Schema

## users

id UUID PK

email TEXT UNIQUE

full_name TEXT

role TEXT

created_at TIMESTAMP

updated_at TIMESTAMP

---

## employees

id UUID PK

nip TEXT UNIQUE

nama_lengkap TEXT

jabatan TEXT

unit_kerja TEXT

nomor_hp TEXT

email TEXT

status_aktif BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP

---

## activities

id UUID PK

nama_kegiatan TEXT UNIQUE

deskripsi TEXT

aktif BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP

---

## activity_schedules

id UUID PK

activity_id UUID FK

tanggal DATE

jam_mulai TIME

jam_selesai TIME

lokasi TEXT

keterangan TEXT

status TEXT

created_at TIMESTAMP

updated_at TIMESTAMP

---

## duty_assignments

id UUID PK

schedule_id UUID FK

employee_id UUID FK

wajib_hadir BOOLEAN

catatan TEXT

created_at TIMESTAMP

---

## attendance

id UUID PK

schedule_id UUID FK

employee_id UUID FK

status TEXT

waktu_absen TIMESTAMP

catatan TEXT

created_by UUID

created_at TIMESTAMP

updated_at TIMESTAMP

---

# 13. Row Level Security

Grand Admin:

FULL ACCESS

Petugas:

SELECT employees

SELECT schedules

INSERT attendance

UPDATE attendance

NO DELETE

---

# 14. UI Pages

/login

/dashboard

/users

/employees

/activities

/schedules

/schedules/[id]

/attendance

/reports

/settings

---

# 15. Non Functional Requirements

Mobile First

Responsive

PWA Ready

Loading State

Empty State

Error Boundary

Server Actions

Type Safe

No any type

Strict TypeScript

---

# 16. Future Version

v1.1

* QR Code Absensi
* Upload Bukti Izin
* Notifikasi WhatsApp

v1.2

* Google Calendar Integration
* Google Drive Integration

v1.3

* Multi Kantor
* Multi Cabang

v2.0

* GPS Check-in
* Face Recognition
* Mobile App
