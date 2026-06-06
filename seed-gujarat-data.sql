-- ================================================================
-- COMPLETE SETUP — ProcurementPal / VendorBridge
-- Paste this entire script in Supabase Dashboard → SQL Editor → Run
-- Creates all tables + RLS policies + seed data (Gujarat records)
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. CREATE TABLES
-- ────────────────────────────────────────────────────────────────

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'Procurement Officer',
  phone_number  TEXT,
  country       TEXT DEFAULT 'India',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- VENDORS
CREATE TABLE IF NOT EXISTS vendors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT NOT NULL,
  category         TEXT NOT NULL,
  gst_number       TEXT,
  contact_details  TEXT,
  rating           NUMERIC(3,1) DEFAULT 4.0,
  status           TEXT NOT NULL DEFAULT 'Pending',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RFQs (Request for Quotations)
CREATE TABLE IF NOT EXISTS rfqs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  product_details JSONB,
  quantity        INTEGER DEFAULT 1,
  deadline        TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Active',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id            UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id         UUID REFERENCES vendors(id) ON DELETE CASCADE,
  pricing_details   NUMERIC(14,2) DEFAULT 0,
  delivery_timeline INTEGER DEFAULT 7,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'Submitted',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- APPROVALS
CREATE TABLE IF NOT EXISTS approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID REFERENCES quotations(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'Pending',
  remarks       TEXT,
  approver_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- PROCUREMENT DOCUMENTS (Purchase Orders)
CREATE TABLE IF NOT EXISTS procurement_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number     INTEGER NOT NULL,
  quotation_id  UUID REFERENCES quotations(id) ON DELETE CASCADE,
  vendor_id     UUID REFERENCES vendors(id) ON DELETE SET NULL,
  po_status     TEXT NOT NULL DEFAULT 'Pending Payment',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY — allow full public access (hackathon mode)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors               ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON profiles;
DROP POLICY IF EXISTS "Allow all for anon" ON vendors;
DROP POLICY IF EXISTS "Allow all for anon" ON rfqs;
DROP POLICY IF EXISTS "Allow all for anon" ON quotations;
DROP POLICY IF EXISTS "Allow all for anon" ON approvals;
DROP POLICY IF EXISTS "Allow all for anon" ON procurement_documents;
DROP POLICY IF EXISTS "Allow all for anon" ON activity_logs;

CREATE POLICY "Allow all for anon" ON profiles              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vendors               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rfqs                  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON quotations            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON approvals             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON procurement_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_logs         FOR ALL USING (true) WITH CHECK (true);


-- ────────────────────────────────────────────────────────────────
-- 3. SEED DATA — Profiles
-- ────────────────────────────────────────────────────────────────

INSERT INTO profiles (id, first_name, email, role, phone_number, country) VALUES
  ('00000001-0000-4000-8000-000000000001', 'Akshat',          'akshat@vendorbridge.app',              'Procurement Officer', '+91 90000 00001', 'India'),
  ('00000001-0000-4000-8000-000000000002', 'Dhruv Patel',     'dhruv.patel@vendorbridge.app',         'Manager',             '+91 98250 67891', 'India'),
  ('00000001-0000-4000-8000-000000000003', 'Meenaben Desai',  'meena.desai@vendorbridge.app',         'Admin',               '+91 97250 34567', 'India'),
  ('00000001-0000-4000-8000-000000000004', 'Jignesh Solanki', 'jignesh.solanki@vendorbridge.app',     'Procurement Officer', '+91 96670 11223', 'India'),
  ('00000001-0000-4000-8000-000000000005', 'Hiral Bhatt',     'hiral.bhatt@vendorbridge.app',         'Procurement Officer', '+91 93745 99001', 'India'),
  ('00000001-0000-4000-8000-000000000006', 'Nikunj Mehta',    'nikunj.mehta@vendorbridge.app',        'Vendor',              '+91 99797 55432', 'India'),
  ('00000001-0000-4000-8000-000000000007', 'Priya Shah',      'priya.shah@vendorbridge.app',           'Manager',             '+91 98200 77001', 'India')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 4. SEED DATA — Vendors
-- ────────────────────────────────────────────────────────────────

INSERT INTO vendors (id, company_name, category, gst_number, contact_details, rating, status) VALUES
  -- Original vendors
  ('00000002-0000-4000-8000-000000000001', 'Infra Supplies Pvt Ltd',        'Furniture',            '22AAAAA0000A1Z5', '+91 98200 11111', 4.6, 'Active'),
  ('00000002-0000-4000-8000-000000000002', 'TechCore Ltd',                  'IT Hardware',          '27BBBBB1111B2Z6', '+91 98765 43210', 4.3, 'Active'),
  ('00000002-0000-4000-8000-000000000003', 'FastLog Logistics',             'Logistics',            '29CCCCC2222C3Z7', '+91 99887 76655', 3.9, 'Active'),
  ('00000002-0000-4000-8000-000000000004', 'Stationery World',              'Stationery',           '07DDDDD3333D4Z8', '+91 90000 12345', 4.1, 'Pending'),
  ('00000002-0000-4000-8000-000000000005', 'GreenBuild Co',                 'Construction',         '19EEEEE4444E5Z9', '+91 87654 32100', 4.5, 'Active'),
  -- Gujarat vendors
  ('00000002-0000-4000-8000-000000000006', 'Akshar Infotech Solutions',     'IT Hardware',          '24AAKCS9321F1ZP', '+91 99099 45678', 4.7, 'Active'),
  ('00000002-0000-4000-8000-000000000007', 'Surat Textile Traders Pvt Ltd', 'Textile & Fabric',     '24BTRST4567G2ZQ', '+91 97234 78901', 4.2, 'Active'),
  ('00000002-0000-4000-8000-000000000008', 'Vadodara Industrial Supplies',  'Industrial Equipment', '24CVDIS8821H3ZR', '+91 98792 33445', 3.8, 'Active'),
  ('00000002-0000-4000-8000-000000000009', 'Rajkot Precision Engineering',  'Mechanical Parts',     '24DRJPE1234J4ZS', '+91 96380 55667', 4.4, 'Pending'),
  ('00000002-0000-4000-8000-000000000010', 'Gandhinagar Office Essentials', 'Stationery',           '24EGNOE7654K5ZT', '+91 93745 12300', 4.0, 'Active')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 5. SEED DATA — RFQs
-- ────────────────────────────────────────────────────────────────

INSERT INTO rfqs (id, title, description, product_details, quantity, deadline, status) VALUES
  -- Original RFQs
  (
    '00000003-0000-4000-8000-000000000001',
    'Office Furniture Procurement Q2',
    'Furniture',
    '{"category":"Furniture","items":[{"name":"Ergonomic Chair","qty":25,"description":"Mesh back, adjustable"},{"name":"Standing Desk","qty":10,"description":"Electric height-adjust"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000001","00000002-0000-4000-8000-000000000005"],"createdAt":"2026-05-20"}',
    35, '2026-06-15T00:00:00Z', 'Active'
  ),
  (
    '00000003-0000-4000-8000-000000000002',
    'Laptops for Engineering Team',
    'IT Hardware',
    '{"category":"IT Hardware","items":[{"name":"Laptop 16GB","qty":40,"description":"i7 / 512GB SSD"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000002"],"createdAt":"2026-05-28"}',
    40, '2026-06-28T00:00:00Z', 'Active'
  ),
  -- Gujarat RFQs
  (
    '00000003-0000-4000-8000-000000000003',
    'Desktop Computers for Ahmedabad Branch',
    'IT Hardware',
    '{"category":"IT Hardware","items":[{"name":"Desktop PC Core i5","qty":20,"description":"8GB RAM, 256GB SSD, Windows 11"},{"name":"24-inch Monitor","qty":20,"description":"Full HD IPS panel"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000006","00000002-0000-4000-8000-000000000002"],"createdAt":"2026-06-01"}',
    40, '2026-07-10T00:00:00Z', 'Active'
  ),
  (
    '00000003-0000-4000-8000-000000000004',
    'Uniform Fabric for Surat Factory Staff',
    'Textile & Fabric',
    '{"category":"Textile & Fabric","items":[{"name":"Cotton Drill Fabric","qty":500,"description":"Navy blue, 150 GSM, standard cut"},{"name":"Reflective Safety Vest","qty":150,"description":"ANSI Class 2 compliant"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000007"],"createdAt":"2026-06-03"}',
    650, '2026-07-05T00:00:00Z', 'Active'
  ),
  (
    '00000003-0000-4000-8000-000000000005',
    'Industrial Compressors for Vadodara Plant',
    'Industrial Equipment',
    '{"category":"Industrial Equipment","items":[{"name":"Rotary Screw Compressor 10HP","qty":3,"description":"Oil-lubricated, 145 PSI max"},{"name":"Air Dryer Unit","qty":3,"description":"Refrigerated type, compatible with above"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000008"],"createdAt":"2026-06-04"}',
    6, '2026-07-20T00:00:00Z', 'Active'
  ),
  (
    '00000003-0000-4000-8000-000000000006',
    'CNC Machined Spare Parts — Rajkot Unit',
    'Mechanical Parts',
    '{"category":"Mechanical Parts","items":[{"name":"Mild Steel Flange (DN50)","qty":80,"description":"IS 2062 Grade A, slip-on type"},{"name":"Stainless Hex Bolt M12","qty":500,"description":"Grade 316 SS, 50mm length"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000009"],"createdAt":"2026-05-25"}',
    580, '2026-06-30T00:00:00Z', 'Closed'
  ),
  (
    '00000003-0000-4000-8000-000000000007',
    'Stationery & Office Supplies — Gandhinagar HQ',
    'Stationery',
    '{"category":"Stationery","items":[{"name":"A4 Copier Paper (500 sheets)","qty":200,"description":"75 GSM, JK Copier or equivalent"},{"name":"Ball Pen Box (10 pcs)","qty":100,"description":"Blue ink, Reynolds or Cello brand"},{"name":"File Folder Plastic","qty":150,"description":"L-shaped, assorted colours"}],"assignedVendorIds":["00000002-0000-4000-8000-000000000010","00000002-0000-4000-8000-000000000004"],"createdAt":"2026-06-02"}',
    450, '2026-06-25T00:00:00Z', 'Active'
  )
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 6. SEED DATA — Quotations
-- ────────────────────────────────────────────────────────────────

INSERT INTO quotations (id, rfq_id, vendor_id, pricing_details, delivery_timeline, notes, status) VALUES
  -- Original quotations
  (
    '00000004-0000-4000-8000-000000000001',
    '00000003-0000-4000-8000-000000000001',
    '00000002-0000-4000-8000-000000000001',
    182000,  -- 25×3600 + 10×9200
    14,
    '{"lines":[{"item":"Ergonomic Chair","qty":25,"unitPrice":3600},{"item":"Standing Desk","qty":10,"unitPrice":9200}],"userNotes":""}',
    'Submitted'
  ),
  (
    '00000004-0000-4000-8000-000000000002',
    '00000003-0000-4000-8000-000000000001',
    '00000002-0000-4000-8000-000000000005',
    185750,  -- 25×3850 + 10×8900
    18,
    '{"lines":[{"item":"Ergonomic Chair","qty":25,"unitPrice":3850},{"item":"Standing Desk","qty":10,"unitPrice":8900}],"userNotes":""}',
    'Submitted'
  ),
  (
    '00000004-0000-4000-8000-000000000003',
    '00000003-0000-4000-8000-000000000002',
    '00000002-0000-4000-8000-000000000002',
    2720000, -- 40×68000
    21,
    '{"lines":[{"item":"Laptop 16GB","qty":40,"unitPrice":68000}],"userNotes":""}',
    'Submitted'
  ),
  -- Gujarat quotations
  (
    '00000004-0000-4000-8000-000000000004',
    '00000003-0000-4000-8000-000000000003',
    '00000002-0000-4000-8000-000000000006',
    1090000, -- 20×42500 + 20×11200
    10,
    '{"lines":[{"item":"Desktop PC Core i5","qty":20,"unitPrice":42500},{"item":"24-inch Monitor","qty":20,"unitPrice":11200}],"userNotes":"Includes 1-year onsite warranty"}',
    'Selected'
  ),
  (
    '00000004-0000-4000-8000-000000000005',
    '00000003-0000-4000-8000-000000000004',
    '00000002-0000-4000-8000-000000000007',
    155500,  -- 500×185 + 150×420
    7,
    '{"lines":[{"item":"Cotton Drill Fabric","qty":500,"unitPrice":185},{"item":"Reflective Safety Vest","qty":150,"unitPrice":420}],"userNotes":"Fabric sourced from GPCL-approved mill, Surat"}',
    'Submitted'
  ),
  (
    '00000004-0000-4000-8000-000000000006',
    '00000003-0000-4000-8000-000000000005',
    '00000002-0000-4000-8000-000000000008',
    489000,  -- 3×125000 + 3×38000
    21,
    '{"lines":[{"item":"Rotary Screw Compressor 10HP","qty":3,"unitPrice":125000},{"item":"Air Dryer Unit","qty":3,"unitPrice":38000}],"userNotes":"Atlas Copco authorised dealer, Vadodara"}',
    'Submitted'
  ),
  (
    '00000004-0000-4000-8000-000000000007',
    '00000003-0000-4000-8000-000000000006',
    '00000002-0000-4000-8000-000000000009',
    68400,   -- 80×680 + 500×28
    5,
    '{"lines":[{"item":"Mild Steel Flange (DN50)","qty":80,"unitPrice":680},{"item":"Stainless Hex Bolt M12","qty":500,"unitPrice":28}],"userNotes":"Material test certificates included"}',
    'Selected'
  ),
  (
    '00000004-0000-4000-8000-000000000008',
    '00000003-0000-4000-8000-000000000007',
    '00000002-0000-4000-8000-000000000010',
    71250,   -- 200×320 + 100×95 + 150×25
    3,
    '{"lines":[{"item":"A4 Copier Paper (500 sheets)","qty":200,"unitPrice":320},{"item":"Ball Pen Box (10 pcs)","qty":100,"unitPrice":95},{"item":"File Folder Plastic","qty":150,"unitPrice":25}],"userNotes":"GST invoice provided; delivery to Sector 11, Gandhinagar"}',
    'Submitted'
  )
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 7. SEED DATA — Approvals
-- ────────────────────────────────────────────────────────────────

INSERT INTO approvals (id, quotation_id, status, remarks, approver_id) VALUES
  -- Original approvals
  (
    '00000005-0000-4000-8000-000000000001',
    '00000004-0000-4000-8000-000000000001',
    'Under Review',
    'Checking compliance with Q2 furniture budget',
    '00000001-0000-4000-8000-000000000007'
  ),
  (
    '00000005-0000-4000-8000-000000000002',
    '00000004-0000-4000-8000-000000000003',
    'Pending',
    NULL,
    NULL
  ),
  -- Gujarat approvals
  (
    '00000005-0000-4000-8000-000000000003',
    '00000004-0000-4000-8000-000000000004',
    'Approved',
    'Best price-to-spec ratio; proceed with PO',
    '00000001-0000-4000-8000-000000000002'
  ),
  (
    '00000005-0000-4000-8000-000000000004',
    '00000004-0000-4000-8000-000000000007',
    'Approved',
    'Delivery timeline acceptable; material certs on file',
    '00000001-0000-4000-8000-000000000003'
  ),
  (
    '00000005-0000-4000-8000-000000000005',
    '00000004-0000-4000-8000-000000000005',
    'Under Review',
    'Awaiting fabric swatch sample verification',
    '00000001-0000-4000-8000-000000000004'
  ),
  (
    '00000005-0000-4000-8000-000000000006',
    '00000004-0000-4000-8000-000000000006',
    'Pending',
    NULL,
    NULL
  ),
  (
    '00000005-0000-4000-8000-000000000007',
    '00000004-0000-4000-8000-000000000008',
    'Approved',
    'Routine stationery replenishment; approved as per SOP',
    '00000001-0000-4000-8000-000000000005'
  )
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 8. SEED DATA — Procurement Documents (Purchase Orders)
-- ────────────────────────────────────────────────────────────────

INSERT INTO procurement_documents (id, po_number, quotation_id, vendor_id, po_status) VALUES
  ('00000006-0000-4000-8000-000000000001', 61, '00000004-0000-4000-8000-000000000001', '00000002-0000-4000-8000-000000000001', 'Pending Payment'),
  ('00000006-0000-4000-8000-000000000002', 74, '00000004-0000-4000-8000-000000000004', '00000002-0000-4000-8000-000000000006', 'Pending Payment'),
  ('00000006-0000-4000-8000-000000000003', 58, '00000004-0000-4000-8000-000000000007', '00000002-0000-4000-8000-000000000009', 'Paid'),
  ('00000006-0000-4000-8000-000000000004', 71, '00000004-0000-4000-8000-000000000008', '00000002-0000-4000-8000-000000000010', 'Paid')
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────────
-- 9. SEED DATA — Activity Logs
-- ────────────────────────────────────────────────────────────────

INSERT INTO activity_logs (id, action, details) VALUES
  -- Original logs
  ('00000007-0000-4000-8000-000000000001', 'quotation', 'Quotation submitted — Infra Supplies Pvt Ltd selected for Office Furniture Q2'),
  ('00000007-0000-4000-8000-000000000002', 'approval',  'Approval pending — PO-2026-0061 awaiting L2 approval by Priya Shah'),
  ('00000007-0000-4000-8000-000000000003', 'rfq',       'RFQ published — Office Furniture Q2 sent to 2 vendors'),
  ('00000007-0000-4000-8000-000000000004', 'vendor',    'Vendor added — FastLog Logistics registered and pending verification'),
  -- Gujarat logs
  ('00000007-0000-4000-8000-000000000005', 'vendor',    'Vendor registered — Akshar Infotech Solutions, Ahmedabad (IT Hardware) verified and activated'),
  ('00000007-0000-4000-8000-000000000006', 'rfq',       'RFQ published — Desktop Computers for Ahmedabad Branch sent to 2 vendors'),
  ('00000007-0000-4000-8000-000000000007', 'approval',  'Quotation approved — Akshar Infotech Solutions selected for Ahmedabad Desktop procurement; PO-2026-0074 raised'),
  ('00000007-0000-4000-8000-000000000008', 'po',        'PO paid — PO-2026-0058 settled; Rajkot Precision Engineering delivered CNC parts to Rajkot Unit'),
  ('00000007-0000-4000-8000-000000000009', 'rfq',       'RFQ published — Stationery & Office Supplies for Gandhinagar HQ assigned to Gandhinagar Office Essentials'),
  ('00000007-0000-4000-8000-000000000010', 'approval',  'Approval under review — Surat Textile Traders fabric quotation pending swatch verification by Jignesh Solanki')
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- DONE! Your database is fully set up.
-- Tables: profiles, vendors, rfqs, quotations, approvals,
--         procurement_documents, activity_logs
-- Records: 7 profiles | 10 vendors | 7 RFQs | 8 quotations |
--          7 approvals | 4 POs | 10 activity logs
-- ================================================================
