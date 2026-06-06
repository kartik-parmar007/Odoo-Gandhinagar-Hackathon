-- ============================================================
-- Fix: Allow public (anon) access to all tables for hackathon
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- VENDORS table
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON vendors;
CREATE POLICY "Allow all for anon" ON vendors FOR ALL USING (true) WITH CHECK (true);

-- PROFILES table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON profiles;
CREATE POLICY "Allow all for anon" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- RFQS table
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON rfqs;
CREATE POLICY "Allow all for anon" ON rfqs FOR ALL USING (true) WITH CHECK (true);

-- QUOTATIONS table
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON quotations;
CREATE POLICY "Allow all for anon" ON quotations FOR ALL USING (true) WITH CHECK (true);

-- APPROVALS table
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON approvals;
CREATE POLICY "Allow all for anon" ON approvals FOR ALL USING (true) WITH CHECK (true);

-- PROCUREMENT_DOCUMENTS table
ALTER TABLE procurement_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON procurement_documents;
CREATE POLICY "Allow all for anon" ON procurement_documents FOR ALL USING (true) WITH CHECK (true);

-- ACTIVITY_LOGS table
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON activity_logs;
CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
