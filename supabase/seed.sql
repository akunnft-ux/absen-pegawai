-- Seed data (run after creating users via Supabase Auth)
-- Create admin user first via Supabase Auth, then:
INSERT INTO users (id, email, full_name, role) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Administrator', 'grand_admin');
INSERT INTO users (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000002', 'petugas@example.com', 'Petugas Absensi', 'petugas');

INSERT INTO employees (nip, nama_lengkap, jabatan, unit_kerja) VALUES
('197501012005011001', 'Budi Santoso', 'Kepala Sub Bagian', 'Umum'),
('197802032006021002', 'Siti Rahmawati', 'Analis Kepegawaian', 'Kepegawaian'),
('198005042007031003', 'Ahmad Hidayat', 'Pranata Komputer', 'Teknologi Informasi'),
('198206052008041004', 'Dewi Kusuma', 'Arsiparis', 'Umum'),
('198407062009051005', 'Rudi Hermawan', 'Staf Keuangan', 'Keuangan');

INSERT INTO activities (nama_kegiatan, deskripsi) VALUES
('Rapat Bulanan', 'Rapat koordinasi bulanan seluruh pegawai'),
('Survey Lapangan', 'Kegiatan survey dan pengumpulan data lapangan'),
('Pelatihan', 'Pelatihan pengembangan kompetensi pegawai');

INSERT INTO activity_schedules (activity_id, tanggal, jam_mulai, jam_selesai, lokasi, status)
SELECT id, CURRENT_DATE + INTERVAL '1 day', '08:00', '10:00', 'Aula Utama', 'published'
FROM activities WHERE nama_kegiatan = 'Rapat Bulanan';
