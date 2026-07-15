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
  feedback_token        text,
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
    o.cancellation_reason, o.feedback_token, o.created_at, o.updated_at
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

-- ── 8. FEEDBACK System ───────────────────────────────────────────────────────
-- Add feedback tracking fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_token TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_requested_at TIMESTAMPTZ;

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid REFERENCES orders(id) ON DELETE CASCADE,
  tracking_id   text NOT NULL,
  customer_name text NOT NULL,
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  title         text,
  message       text NOT NULL,
  is_approved   boolean NOT NULL DEFAULT false,
  is_published  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Feedback RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published feedback" ON feedback;
CREATE POLICY "Anyone can read published feedback" ON feedback
  FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS "Service role manages all" ON feedback;
CREATE POLICY "Service role manages all" ON feedback
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 9. CANCELLATION REQUESTS & FEEDBACK INTEGRATION ─────────────────────────
-- Add cancellation request fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_requested boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_requested_reason text;

-- Update get_order_by_tracking to return cancellation request fields, has_submitted_feedback, and quote details
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
  feedback_token        text,
  cancellation_requested boolean,
  cancellation_requested_reason text,
  has_submitted_feedback boolean,
  quoted_price          numeric,
  print_preferences     jsonb,
  message               text,
  stl_file_url          text,
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
    o.cancellation_reason, o.feedback_token, o.cancellation_requested, o.cancellation_requested_reason,
    EXISTS (SELECT 1 FROM feedback f WHERE f.order_id = o.id) AS has_submitted_feedback,
    o.quoted_price, o.print_preferences, o.message, o.stl_file_url,
    o.created_at, o.updated_at
  FROM orders o
  WHERE o.tracking_id = p_tracking_id
  LIMIT 1;
END;
$$;

-- ── 10. STORAGE BUCKETS ──────────────────────────────────────────────────────
-- Insert storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('product-images', 'product-images', true, 10485760),
  ('invoices', 'invoices', false, 10485760),
  ('stl-files', 'stl-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- ── 11. MULTI-IMAGE & MULTI-CATEGORY SUPPORT FOR PRODUCTS ───────────────────
-- Add image_urls and categories columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}'::text[];

-- Migrate existing data
UPDATE products 
SET image_urls = ARRAY[image_url] 
WHERE (image_urls IS NULL OR array_length(image_urls, 1) IS NULL) AND image_url IS NOT NULL;

UPDATE products 
SET categories = ARRAY[category] 
WHERE (categories IS NULL OR array_length(categories, 1) IS NULL) AND category IS NOT NULL;

-- ── DONE ──────────────────────────────────────────────────────────────────
-- After running this, go to Supabase Dashboard → Authentication → Users
-- and create your admin user manually with email: debasish.mohanty169@gmail.com
