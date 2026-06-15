-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Grand Admin: FULL ACCESS
CREATE POLICY "grand_admin_all_users" ON users FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin')
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin'));

CREATE POLICY "grand_admin_all_employees" ON employees FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin')
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin'));

CREATE POLICY "grand_admin_all_activities" ON activities FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin')
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin'));

CREATE POLICY "grand_admin_all_schedules" ON activity_schedules FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin')
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin'));

CREATE POLICY "grand_admin_all_assignments" ON duty_assignments FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin')
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin'));

CREATE POLICY "grand_admin_all_attendance" ON attendance FOR ALL USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin')
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'grand_admin'));

-- Petugas: SELECT employees, SELECT schedules, INSERT/UPDATE attendance, NO DELETE
CREATE POLICY "petugas_select_employees" ON employees FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'petugas')
);

CREATE POLICY "petugas_select_schedules" ON activity_schedules FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'petugas')
);

CREATE POLICY "petugas_select_assignments" ON duty_assignments FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'petugas')
);

CREATE POLICY "petugas_insert_attendance" ON attendance FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('petugas', 'grand_admin'))
);

CREATE POLICY "petugas_update_attendance" ON attendance FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('petugas', 'grand_admin'))
) WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('petugas', 'grand_admin')));

CREATE POLICY "petugas_select_attendance" ON attendance FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('petugas', 'grand_admin'))
);

-- Petugas: SELECT activities (read-only)
CREATE POLICY "petugas_select_activities" ON activities FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'petugas')
);
