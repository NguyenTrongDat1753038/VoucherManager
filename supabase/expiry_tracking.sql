-- ========================================
-- VOUCHER MANAGER - EXPIRY TRACKING
-- ========================================
--
-- Thêm tính năng theo dõi hạn sử dụng voucher
-- Chạy file này SAU KHI đã chạy setup.sql và improvements.sql
--
-- Features:
-- 1. expiry_date column cho vouchers
-- 2. Index để query nhanh
-- 3. Auto-expire function (chạy theo schedule)
-- 4. View cho vouchers sắp hết hạn
-- 5. Cập nhật audit trigger
--

-- ========================================
-- 1. THÊM EXPIRY_DATE COLUMN
-- ========================================

ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS expiry_date DATE;

COMMENT ON COLUMN public.vouchers.expiry_date IS 'Ngày hết hạn của voucher (NULL = không có hạn)';

-- ========================================
-- 2. TẠO INDEX CHO FAST QUERIES
-- ========================================

-- Index cho query vouchers theo expiry_date
CREATE INDEX IF NOT EXISTS idx_vouchers_expiry_date 
ON public.vouchers(expiry_date) 
WHERE expiry_date IS NOT NULL;

-- Composite index cho query UNUSED vouchers sắp hết hạn
CREATE INDEX IF NOT EXISTS idx_vouchers_status_expiry 
ON public.vouchers(status, expiry_date) 
WHERE status = 'UNUSED' AND expiry_date IS NOT NULL;

-- ========================================
-- 3. AUTO-EXPIRE FUNCTION
-- ========================================
-- Tự động chuyển UNUSED → EXPIRED khi quá hạn
-- Dùng SECURITY DEFINER để bypass RLS

CREATE OR REPLACE FUNCTION public.auto_expire_vouchers()
RETURNS TABLE (
    expired_count INTEGER,
    voucher_ids UUID[]
) AS $$
DECLARE
    v_expired_ids UUID[];
    v_count INTEGER;
BEGIN
    -- Lấy danh sách vouchers cần expire
    SELECT ARRAY_AGG(id) INTO v_expired_ids
    FROM public.vouchers
    WHERE 
        status = 'UNUSED'
        AND expiry_date IS NOT NULL
        AND expiry_date < CURRENT_DATE;
    
    -- Nếu không có gì để expire
    IF v_expired_ids IS NULL OR array_length(v_expired_ids, 1) IS NULL THEN
        RETURN QUERY SELECT 0::INTEGER, ARRAY[]::UUID[];
        RETURN;
    END IF;
    
    -- Update status to EXPIRED
    UPDATE public.vouchers
    SET 
        status = 'EXPIRED',
        version = version + 1,
        last_modified_at = now()
    WHERE id = ANY(v_expired_ids);
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Log to audit (dùng NULL cho changed_by vì đây là system action)
    INSERT INTO public.voucher_audit_log (
        voucher_id,
        old_status,
        new_status,
        changed_by,
        notes,
        voucher_version
    )
    SELECT 
        v.id,
        'UNUSED'::voucher_status,
        'EXPIRED'::voucher_status,
        v.owner_id,  -- Ghi nhận owner thay vì NULL
        'Auto-expired: voucher đã quá hạn sử dụng (expiry_date: ' || v.expiry_date::TEXT || ')',
        v.version
    FROM public.vouchers v
    WHERE v.id = ANY(v_expired_ids);
    
    RETURN QUERY SELECT v_count, v_expired_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chỉ cho phép service_role gọi function này
REVOKE ALL ON FUNCTION public.auto_expire_vouchers FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_expire_vouchers FROM authenticated;
-- Lưu ý: Supabase Dashboard hoặc Edge Functions sẽ dùng service_role

COMMENT ON FUNCTION public.auto_expire_vouchers IS 'Tự động chuyển UNUSED vouchers thành EXPIRED khi quá hạn. Chạy bằng pg_cron hoặc Supabase scheduled function.';

-- ========================================
-- 4. VIEW: VOUCHERS SẮP HẾT HẠN
-- ========================================
-- Hiển thị vouchers UNUSED sẽ hết hạn trong 7 ngày tới

CREATE OR REPLACE VIEW public.expiring_soon_vouchers AS
SELECT 
    v.*,
    v.expiry_date - CURRENT_DATE AS days_until_expiry,
    CASE 
        WHEN v.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN v.expiry_date = CURRENT_DATE THEN 'EXPIRES_TODAY'
        WHEN v.expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'CRITICAL'
        WHEN v.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'WARNING'
        ELSE 'NORMAL'
    END AS urgency_level
FROM public.vouchers v
WHERE 
    v.status = 'UNUSED'
    AND v.expiry_date IS NOT NULL
    AND v.expiry_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY v.expiry_date ASC;

COMMENT ON VIEW public.expiring_soon_vouchers IS 'Vouchers UNUSED sẽ hết hạn trong 7 ngày tới';

-- RLS cho view (tự động áp dụng từ base table)

-- ========================================
-- 5. HELPER FUNCTIONS
-- ========================================

-- Function: Đếm vouchers theo urgency level
CREATE OR REPLACE FUNCTION public.get_expiry_stats(p_owner_id UUID DEFAULT NULL)
RETURNS TABLE (
    urgency_level TEXT,
    count BIGINT,
    total_value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN v.expiry_date < CURRENT_DATE THEN 'EXPIRED'
            WHEN v.expiry_date = CURRENT_DATE THEN 'EXPIRES_TODAY'
            WHEN v.expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'CRITICAL'
            WHEN v.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'WARNING'
            ELSE 'NORMAL'
        END AS urgency,
        COUNT(*)::BIGINT,
        COALESCE(SUM(v.value), 0)::BIGINT
    FROM public.vouchers v
    WHERE 
        v.status = 'UNUSED'
        AND v.expiry_date IS NOT NULL
        AND (p_owner_id IS NULL OR v.owner_id = p_owner_id)
    GROUP BY urgency
    ORDER BY 
        CASE urgency
            WHEN 'EXPIRED' THEN 1
            WHEN 'EXPIRES_TODAY' THEN 2
            WHEN 'CRITICAL' THEN 3
            WHEN 'WARNING' THEN 4
            ELSE 5
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_expiry_stats TO authenticated;

COMMENT ON FUNCTION public.get_expiry_stats IS 'Thống kê vouchers theo mức độ cấp bách hết hạn';

-- ========================================
-- 6. CẬP NHẬT AUDIT TRIGGER
-- ========================================
-- Thêm log khi expiry_date thay đổi

CREATE OR REPLACE FUNCTION public.log_voucher_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log if status, customer, or expiry_date changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR 
       (OLD.customer_name IS DISTINCT FROM NEW.customer_name) OR
       (OLD.expiry_date IS DISTINCT FROM NEW.expiry_date) THEN
        
        INSERT INTO public.voucher_audit_log (
            voucher_id,
            old_status,
            new_status,
            old_customer_name,
            new_customer_name,
            changed_by,
            voucher_version,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            OLD.customer_name,
            NEW.customer_name,
            COALESCE(auth.uid(), NEW.owner_id),
            NEW.version,
            CASE 
                WHEN OLD.status = 'UNUSED' AND NEW.status = 'SENT' THEN 'Voucher sent to customer'
                WHEN OLD.status = 'SENT' AND NEW.status = 'SOLD' THEN 'Payment confirmed'
                WHEN OLD.status = 'UNUSED' AND NEW.status = 'EXPIRED' THEN 
                    CASE 
                        WHEN OLD.expiry_date IS NOT NULL THEN 'Auto-expired (hết hạn: ' || OLD.expiry_date::TEXT || ')'
                        ELSE 'Marked as expired'
                    END
                WHEN OLD.expiry_date IS DISTINCT FROM NEW.expiry_date THEN 
                    'Expiry date changed: ' || COALESCE(OLD.expiry_date::TEXT, 'NULL') || ' → ' || COALESCE(NEW.expiry_date::TEXT, 'NULL')
                ELSE 'Status changed'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. VERIFICATION
-- ========================================

DO $$
BEGIN
    -- Check expiry_date column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vouchers' AND column_name = 'expiry_date'
    ) THEN
        RAISE NOTICE '✅ expiry_date column added';
    ELSE
        RAISE NOTICE '❌ expiry_date column missing';
    END IF;
    
    -- Check index
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_vouchers_expiry_date'
    ) THEN
        RAISE NOTICE '✅ Expiry index created';
    ELSE
        RAISE NOTICE '❌ Expiry index missing';
    END IF;
    
    -- Check auto_expire function
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'auto_expire_vouchers'
    ) THEN
        RAISE NOTICE '✅ auto_expire_vouchers function created';
    ELSE
        RAISE NOTICE '❌ auto_expire_vouchers function missing';
    END IF;
    
    -- Check view
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'expiring_soon_vouchers'
    ) THEN
        RAISE NOTICE '✅ expiring_soon_vouchers view created';
    ELSE
        RAISE NOTICE '❌ expiring_soon_vouchers view missing';
    END IF;
END $$;

-- ========================================
-- 8. SETUP HƯỚNG DẪN
-- ========================================

/*
╔══════════════════════════════════════════════════════════════════╗
║  EXPIRY TRACKING SETUP COMPLETE!                                 ║
╚══════════════════════════════════════════════════════════════════╝

📋 ĐÃ THÊM:
  ✅ expiry_date DATE column
  ✅ Index cho fast queries
  ✅ auto_expire_vouchers() function  
  ✅ expiring_soon_vouchers view
  ✅ get_expiry_stats() helper function
  ✅ Cập nhật audit trigger

🔧 SETUP AUTO-EXPIRE (chọn 1 trong 2):

  OPTION A: Supabase Scheduled Function (Khuyến nghị)
  ─────────────────────────────────────────────────────
  1. Vào Supabase Dashboard → Edge Functions
  2. Tạo function mới "auto-expire-vouchers"
  3. Code:
     
     import { createClient } from '@supabase/supabase-js'
     
     Deno.serve(async () => {
       const supabase = createClient(
         Deno.env.get('SUPABASE_URL')!,
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
       )
       
       const { data, error } = await supabase.rpc('auto_expire_vouchers')
       
       return new Response(JSON.stringify({ data, error }))
     })

  4. Setup Cron trigger: "0 0 * * *" (chạy lúc 00:00 mỗi ngày)

  OPTION B: pg_cron (nếu có extension)
  ─────────────────────────────────────
  -- Enable extension (cần Supabase Pro)
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  
  -- Schedule daily at midnight
  SELECT cron.schedule(
    'auto-expire-vouchers',
    '0 0 * * *',
    $$SELECT * FROM public.auto_expire_vouchers()$$
  );

📊 CÁCH SỬ DỤNG:

  -- Xem vouchers sắp hết hạn
  SELECT * FROM public.expiring_soon_vouchers 
  WHERE owner_id = auth.uid();

  -- Thống kê theo urgency
  SELECT * FROM public.get_expiry_stats(auth.uid());
  
  -- Chạy auto-expire thủ công (test)
  SELECT * FROM public.auto_expire_vouchers();

*/

-- ========================================
-- SAMPLE QUERIES (for testing)
-- ========================================

-- Query 1: Update existing voucher with expiry date
/*
UPDATE public.vouchers 
SET expiry_date = '2025-01-15'
WHERE id = 'your-voucher-id';
*/

-- Query 2: Insert new voucher with expiry
/*
INSERT INTO public.vouchers (brand, value, type, code, expiry_date, owner_id)
VALUES ('Traveloka', 100000, 'CODE', 'TEST-123', '2025-01-31', auth.uid());
*/

-- Query 3: View expiring vouchers
/*
SELECT 
    brand, value, code, expiry_date, days_until_expiry, urgency_level
FROM public.expiring_soon_vouchers;
*/
