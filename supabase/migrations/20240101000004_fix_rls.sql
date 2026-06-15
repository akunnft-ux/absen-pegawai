-- Allow users to read their own profile
DROP POLICY IF EXISTS "users_self_select" ON users;
CREATE POLICY "users_self_select" ON users
  FOR SELECT
  USING (auth.uid() = id);
