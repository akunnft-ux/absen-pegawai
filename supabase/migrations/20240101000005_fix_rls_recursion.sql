-- SECURITY DEFINER function to check grand_admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_grand_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'grand_admin'
  );
$$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS "grand_admin_all_users" ON users;
DROP POLICY IF EXISTS "users_self_select" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "petugas_select_users" ON users;

CREATE POLICY "admin_all_users" ON users FOR ALL USING (public.is_grand_admin()) WITH CHECK (public.is_grand_admin());
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);

-- Employees table policies
DROP POLICY IF EXISTS "grand_admin_all_employees" ON employees;
DROP POLICY IF EXISTS "petugas_select_employees" ON employees;
CREATE POLICY "admin_all_employees" ON employees FOR ALL USING (public.is_grand_admin()) WITH CHECK (public.is_grand_admin());
CREATE POLICY "employee_select_all" ON employees FOR SELECT USING (auth.role() = 'authenticated');

-- Activities table policies
DROP POLICY IF EXISTS "grand_admin_all_activities" ON activities;
DROP POLICY IF EXISTS "petugas_select_activities" ON activities;
CREATE POLICY "admin_all_activities" ON activities FOR ALL USING (public.is_grand_admin()) WITH CHECK (public.is_grand_admin());
CREATE POLICY "all_select_activities" ON activities FOR SELECT USING (auth.role() = 'authenticated');

-- Activity schedules table policies
DROP POLICY IF EXISTS "grand_admin_all_schedules" ON activity_schedules;
DROP POLICY IF EXISTS "petugas_select_schedules" ON activity_schedules;
CREATE POLICY "admin_all_schedules" ON activity_schedules FOR ALL USING (public.is_grand_admin()) WITH CHECK (public.is_grand_admin());
CREATE POLICY "all_select_schedules" ON activity_schedules FOR SELECT USING (auth.role() = 'authenticated');

-- Duty assignments table policies
DROP POLICY IF EXISTS "grand_admin_all_assignments" ON duty_assignments;
DROP POLICY IF EXISTS "petugas_select_assignments" ON duty_assignments;
CREATE POLICY "admin_all_assignments" ON duty_assignments FOR ALL USING (public.is_grand_admin()) WITH CHECK (public.is_grand_admin());
CREATE POLICY "all_select_assignments" ON duty_assignments FOR SELECT USING (auth.role() = 'authenticated');

-- Attendance table policies
DROP POLICY IF EXISTS "grand_admin_all_attendance" ON attendance;
DROP POLICY IF EXISTS "petugas_insert_attendance" ON attendance;
DROP POLICY IF EXISTS "petugas_update_attendance" ON attendance;
DROP POLICY IF EXISTS "petugas_select_attendance" ON attendance;
CREATE POLICY "admin_all_attendance" ON attendance FOR ALL USING (public.is_grand_admin()) WITH CHECK (public.is_grand_admin());
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (auth.role() = 'authenticated');
