-- ============================================================
-- PrintVerse Technologies — Supabase Migration
-- Run this entire file in the Supabase SQL Editor (once only)
-- ============================================================

-- ── 1. PRODUCTS table (must exist before orders references it) ──────────────

CREATE TABLE IF NOT EXISTS products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  slug           text UNIQUE NOT NULL,
  description    text,
  price          numeric NOT NULL,
  category       text NOT NULL
                   CHECK (category IN ('Heritage','Gift','Home','Kids','Office','Engineering')),
  image_url      text,
  is_available   boolean NOT NULL DEFAULT true,
  is_coming_soon boolean NOT NULL DEFAULT false,
  display_order  integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 2. ORDERS table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id           text UNIQUE NOT NULL,
  order_type            text NOT NULL DEFAULT 'quote'
                          CHECK (order_type IN ('quote','purchase')),
  customer_name         text NOT NULL,
  email                 text NOT NULL,
  phone                 text NOT NULL,
  -- Quote-flow fields
  stl_file_url          text,
  message               text,
  print_preferences     jsonb,
  quoted_price          numeric,
  -- Purchase-flow fields
  product_id            uuid REFERENCES products(id),
  quantity              integer NOT NULL DEFAULT 1,
  delivery_address_line text,
  delivery_city         text,
  delivery_state        text,
  delivery_pincode      text,
  delivery_charge       numeric NOT NULL DEFAULT 0,
  subtotal              numeric,
  total_amount          numeric,
  -- Shared payment
  payment_link          text,
  paid_at               timestamptz,
  -- Status
  status                text NOT NULL DEFAULT 'Requested'
                          CHECK (status IN (
                            'Requested','Contacted','Quoted',
                            'Payment Pending','Payment Received',
                            'Paid','Confirmed','Printing','Invoice Sent',
                            'Shipped','Completed','Cancelled'
                          )),
  -- Confirmation & invoice (purchase flow)
  confirmed_via_call    boolean NOT NULL DEFAULT false,
  confirmed_at          timestamptz,
  invoice_released      boolean NOT NULL DEFAULT false,
  invoice_url           text,
  invoice_released_at   timestamptz,
  -- Cancellation
  cancellation_reason   text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── 3. SETTINGS table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO settings (key, value) VALUES ('delivery_flat_rate', '80')
  ON CONFLICT (key) DO NOTHING;

-- ── 4. UPDATED_AT triggers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 5. ROW LEVEL SECURITY ───────────────────────────────────────────────────

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

-- No direct SELECT for anon — all public reads go via SECURITY DEFINER RPCs below
DROP POLICY IF EXISTS "admin_all_orders" ON orders;
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "admin_all_products" ON products;
CREATE POLICY "admin_all_products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SETTINGS (public read for delivery rate; admin write)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "admin_all_settings" ON settings;
CREATE POLICY "admin_all_settings" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 6. SECURITY DEFINER RPC FUNCTIONS ──────────────────────────────────────

-- Public: full order by tracking_id (for timeline display)
DROP FUNCTION IF EXISTS get_order_by_tracking(text);
CREATE OR REPLACE FUNCTION get_order_by_tracking(p_tracking_id text)
RETURNS TABLE (
  id                    uuid,
  tracking_id           text,
  order_type            text,
  status                text,
  customer_name         text,
  email                 text,
  phone                 text,
  product_id            uuid,
  quantity              integer,
  delivery_address_line text,
  delivery_city         text,
  delivery_state        text,
  delivery_pincode      text,
  delivery_charge       numeric,
  subtotal              numeric,
  total_amount          numeric,
  invoice_released      boolean,
  invoice_url           text,
  cancellation_reason   text,
  created_at            timestamptz,
  updated_at            timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id, o.tracking_id, o.order_type, o.status, o.customer_name,
    o.email, o.phone, o.product_id, o.quantity,
    o.delivery_address_line, o.delivery_city, o.delivery_state,
    o.delivery_pincode, o.delivery_charge, o.subtotal, o.total_amount,
    o.invoice_released,
    -- Only return invoice_url when invoice has been released
    CASE WHEN o.invoice_released THEN o.invoice_url ELSE NULL END AS invoice_url,
    o.cancellation_reason, o.created_at, o.updated_at
  FROM orders o
  WHERE o.tracking_id = p_tracking_id
  LIMIT 1;
END;
$$;

-- Public: minimal order list by phone + email (BOTH must match same row)
DROP FUNCTION IF EXISTS get_orders_by_phone_email(text, text);
CREATE OR REPLACE FUNCTION get_orders_by_phone_email(p_phone text, p_email text)
RETURNS TABLE (
  tracking_id text,
  order_type  text,
  status      text,
  created_at  timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT o.tracking_id, o.order_type, o.status, o.created_at
  FROM orders o
  WHERE o.phone = p_phone AND o.email = p_email
  ORDER BY o.created_at DESC;
END;
$$;

-- ── 7. STORAGE BUCKETS ─────────────────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage → New Bucket (UI is easiest):
--
-- Bucket 1: stl-uploads
--   Public: NO
--   File size limit: 50MB
--   Policies:
--     INSERT: anon, WITH CHECK (true)
--     SELECT/UPDATE/DELETE: authenticated only
--
-- Bucket 2: product-images
--   Public: YES (public read)
--   File size limit: 10MB
--   Policies:
--     SELECT: public (no RLS needed for public bucket)
--     INSERT/UPDATE/DELETE: authenticated only
--
-- Bucket 3: invoices
--   Public: NO
--   File size limit: 5MB
--   Policies:
--     INSERT/SELECT/UPDATE/DELETE: authenticated only
--     (Customer gets a signed URL generated server-side)

-- ── DONE ──────────────────────────────────────────────────────────────────
-- After running this, go to Supabase Dashboard → Authentication → Users
-- and create your admin user manually with email: debasish.mohanty169@gmail.com
