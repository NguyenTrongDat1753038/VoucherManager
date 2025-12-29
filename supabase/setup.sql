-- ========================================
-- VOUCHER MANAGER - SUPABASE SQL SETUP
-- ========================================
--
-- This script creates all necessary database objects for the Voucher Manager app.
-- Run this in your Supabase SQL Editor after creating a new project.
--
-- Order of execution:
-- 1. Create custom types (enums)
-- 2. Create tables
-- 3. Enable Row Level Security (RLS)
-- 4. Create RLS policies
-- 5. Create storage bucket
-- 6. Create storage policies

-- ========================================
-- 1. CREATE CUSTOM TYPES (ENUMS)
-- ========================================

-- Voucher type enum
CREATE TYPE voucher_type AS ENUM ('CODE', 'IMAGE');

-- Voucher status enum
CREATE TYPE voucher_status AS ENUM ('UNUSED', 'SENT', 'SOLD', 'USED', 'EXPIRED');

-- ========================================
-- 2. CREATE TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS public.vouchers (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Voucher information
    brand TEXT NOT NULL,
    value INTEGER NOT NULL CHECK (value > 0),
    type voucher_type NOT NULL,
    
    -- Voucher content (one must be filled based on type)
    code TEXT,
    image_url TEXT,
    
    -- Status tracking
    status voucher_status NOT NULL DEFAULT 'UNUSED',
    
    -- Customer information
    customer_name TEXT,
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Owner reference
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT code_or_image_required CHECK (
        (type = 'CODE' AND code IS NOT NULL) OR
        (type = 'IMAGE' AND image_url IS NOT NULL)
    )
);

-- ========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Index for faster queries by owner
CREATE INDEX idx_vouchers_owner_id ON public.vouchers(owner_id);

-- Index for faster queries by status
CREATE INDEX idx_vouchers_status ON public.vouchers(status);

-- Index for faster queries by owner and status (composite)
CREATE INDEX idx_vouchers_owner_status ON public.vouchers(owner_id, status);

-- Index for faster searches on brand
CREATE INDEX idx_vouchers_brand ON public.vouchers(brand);

-- ========================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CREATE RLS POLICIES
-- ========================================

-- Policy: Users can view only their own vouchers
CREATE POLICY "Users can view own vouchers"
    ON public.vouchers
    FOR SELECT
    USING (auth.uid() = owner_id);

-- Policy: Users can insert their own vouchers
CREATE POLICY "Users can insert own vouchers"
    ON public.vouchers
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update ONLY UNUSED or SENT vouchers
-- This prevents editing SOLD/USED vouchers (read-only once sold)
CREATE POLICY "Users can update only UNUSED or SENT vouchers"
    ON public.vouchers
    FOR UPDATE
    USING (
        auth.uid() = owner_id 
        AND (status = 'UNUSED' OR status = 'SENT')
    )
    WITH CHECK (
        auth.uid() = owner_id
    );

-- Policy: DELETE is DISABLED for all users
-- Vouchers should NEVER be deleted, only status changed
-- If you want to allow admins to delete, create a separate policy with additional checks

-- IMPORTANT: No DELETE policy = nobody can delete vouchers

-- ========================================
-- 6. CREATE STORAGE BUCKET
-- ========================================

-- Note: This needs to be executed in the Supabase Storage section
-- OR you can do it manually in the Supabase Dashboard

INSERT INTO storage.buckets (id, name, public)
VALUES ('voucher-images', 'voucher-images', true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. STORAGE POLICIES
-- ========================================

-- Policy: Authenticated users can upload their own voucher images
CREATE POLICY "Users can upload own voucher images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'voucher-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Authenticated users can view their own voucher images
CREATE POLICY "Users can view own voucher images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'voucher-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Public can view voucher images (since bucket is public)
-- This allows sharing images via public URLs
CREATE POLICY "Anyone can view voucher images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'voucher-images');

-- Policy: Users can update their own images
CREATE POLICY "Users can update own voucher images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'voucher-images' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'voucher-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own voucher images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'voucher-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ========================================
-- 8. VERIFICATION QUERIES
-- ========================================

-- After running the above, verify with these queries:

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vouchers'
);

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'vouchers';

-- Check policies
SELECT * 
FROM pg_policies 
WHERE tablename = 'vouchers';

-- Check storage bucket
SELECT * 
FROM storage.buckets 
WHERE id = 'voucher-images';

-- ========================================
-- 9. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ========================================

-- Insert a test voucher (replace 'YOUR_USER_ID' with actual auth.users.id)
/*
INSERT INTO public.vouchers (brand, value, type, code, status, owner_id)
VALUES ('Traveloka', 100000, 'CODE', 'TEST-CODE-123', 'UNUSED', 'YOUR_USER_ID');
*/

-- ========================================
-- SETUP COMPLETE!
-- ========================================
