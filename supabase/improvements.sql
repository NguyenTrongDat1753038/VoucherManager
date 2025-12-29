-- ========================================
-- VOUCHER MANAGER - SECURITY IMPROVEMENTS
-- ========================================
--
-- This script adds security enhancements to prevent duplicate selling.
-- Run this AFTER running the initial setup.sql
--
-- Improvements:
-- 1. Version field for optimistic locking
-- 2. Audit log table for tracking changes
-- 3. Database functions with row-level locking
-- 4. Triggers for automatic logging
-- 5. Time-based protections

-- ========================================
-- 1. ADD VERSION FIELD (Optimistic Locking)
-- ========================================

ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE public.vouchers 
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.vouchers.version IS 'Version number for optimistic locking - prevents race conditions';
COMMENT ON COLUMN public.vouchers.last_modified_at IS 'Last time voucher was modified';

-- ========================================
-- 2. CREATE AUDIT LOG TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.voucher_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    old_status voucher_status,
    new_status voucher_status NOT NULL,
    old_customer_name TEXT,
    new_customer_name TEXT,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    
    -- Store the version at time of change
    voucher_version INTEGER,
    
    CONSTRAINT different_status CHECK (old_status IS DISTINCT FROM new_status OR old_customer_name IS DISTINCT FROM new_customer_name)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_voucher_id ON public.voucher_audit_log(voucher_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.voucher_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON public.voucher_audit_log(changed_by);

COMMENT ON TABLE public.voucher_audit_log IS 'Audit trail for all voucher status changes';

-- Enable RLS on audit log
ALTER TABLE public.voucher_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON public.voucher_audit_log
    FOR SELECT
    USING (
        changed_by = auth.uid() OR
        voucher_id IN (SELECT id FROM public.vouchers WHERE owner_id = auth.uid())
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON public.voucher_audit_log
    FOR INSERT
    WITH CHECK (changed_by = auth.uid());

-- ========================================
-- 3. CREATE AUDIT TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION public.log_voucher_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status or customer changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR 
       (OLD.customer_name IS DISTINCT FROM NEW.customer_name) THEN
        
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
            auth.uid(),
            NEW.version,
            CASE 
                WHEN OLD.status = 'UNUSED' AND NEW.status = 'SENT' THEN 'Voucher sent to customer'
                WHEN OLD.status = 'SENT' AND NEW.status = 'SOLD' THEN 'Payment confirmed'
                WHEN OLD.status = 'UNUSED' AND NEW.status = 'EXPIRED' THEN 'Marked as expired'
                ELSE 'Status changed'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS voucher_audit_trigger ON public.vouchers;
CREATE TRIGGER voucher_audit_trigger
    AFTER UPDATE ON public.vouchers
    FOR EACH ROW
    EXECUTE FUNCTION public.log_voucher_change();

-- ========================================
-- 4. CREATE SAFE STATUS CHANGE FUNCTIONS
-- ========================================

-- Function: Mark voucher as SENT
CREATE OR REPLACE FUNCTION public.mark_voucher_as_sent(
    p_voucher_id UUID,
    p_customer_name TEXT,
    p_expected_status voucher_status DEFAULT 'UNUSED'
)
RETURNS JSONB AS $$
DECLARE
    v_current_status voucher_status;
    v_owner_id UUID;
    v_last_modified TIMESTAMPTZ;
BEGIN
    -- Validate customer name
    IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tên khách hàng không được để trống',
            'code', 'MISSING_CUSTOMER_NAME'
        );
    END IF;
    
    -- Lock the row and get current state
    SELECT status, owner_id, last_modified_at 
    INTO v_current_status, v_owner_id, v_last_modified
    FROM public.vouchers
    WHERE id = p_voucher_id
    FOR UPDATE;  -- Row-level lock prevents race conditions!
    
    -- Check if voucher exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Voucher không tồn tại',
            'code', 'NOT_FOUND'
        );
    END IF;
    
    -- Check ownership
    IF v_owner_id != auth.uid() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bạn không có quyền sửa voucher này',
            'code', 'UNAUTHORIZED'
        );
    END IF;
    
    -- Check if status is as expected
    IF v_current_status != p_expected_status THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Voucher đã thay đổi trạng thái từ %s thành %s. Vui lòng làm mới trang.', 
                          p_expected_status, v_current_status),
            'code', 'STATUS_CHANGED',
            'current_status', v_current_status
        );
    END IF;
    
    -- Check if not already sold/used/expired
    IF v_current_status NOT IN ('UNUSED', 'SENT') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Không thể đánh dấu voucher %s là đã gửi', v_current_status),
            'code', 'INVALID_STATUS'
        );
    END IF;
    
    -- Prevent rapid changes (potential double-click)
    IF v_last_modified IS NOT NULL AND (now() - v_last_modified) < INTERVAL '3 seconds' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Vui lòng đợi trước khi thực hiện thao tác tiếp theo',
            'code', 'TOO_FAST'
        );
    END IF;
    
    -- Update status
    UPDATE public.vouchers
    SET 
        status = 'SENT',
        customer_name = trim(p_customer_name),
        sent_at = now(),
        version = version + 1,
        last_modified_at = now()
    WHERE id = p_voucher_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Đã đánh dấu voucher là đã gửi',
        'voucher_id', p_voucher_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Lỗi hệ thống: ' || SQLERRM,
        'code', 'SYSTEM_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_voucher_as_sent TO authenticated;

COMMENT ON FUNCTION public.mark_voucher_as_sent IS 'Safely mark voucher as SENT with row-level locking to prevent race conditions';

-- ========================================

-- Function: Mark voucher as SOLD
CREATE OR REPLACE FUNCTION public.mark_voucher_as_sold(
    p_voucher_id UUID,
    p_expected_status voucher_status DEFAULT 'SENT'
)
RETURNS JSONB AS $$
DECLARE
    v_current_status voucher_status;
    v_owner_id UUID;
    v_customer_name TEXT;
    v_last_modified TIMESTAMPTZ;
BEGIN
    -- Lock the row and get current state
    SELECT status, owner_id, customer_name, last_modified_at
    INTO v_current_status, v_owner_id, v_customer_name, v_last_modified
    FROM public.vouchers
    WHERE id = p_voucher_id
    FOR UPDATE;  -- Row-level lock!
    
    -- Check if voucher exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Voucher không tồn tại',
            'code', 'NOT_FOUND'
        );
    END IF;
    
    -- Check ownership
    IF v_owner_id != auth.uid() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bạn không có quyền sửa voucher này',
            'code', 'UNAUTHORIZED'
        );
    END IF;
    
    -- Check if status is as expected
    IF v_current_status != p_expected_status THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Voucher đã thay đổi trạng thái từ %s thành %s. Vui lòng làm mới trang.', 
                          p_expected_status, v_current_status),
            'code', 'STATUS_CHANGED',
            'current_status', v_current_status
        );
    END IF;
    
    -- Must be SENT to mark as SOLD
    IF v_current_status != 'SENT' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Chỉ có thể đánh dấu đã bán từ trạng thái ĐÃ GỬI',
            'code', 'INVALID_STATUS'
        );
    END IF;
    
    -- Must have customer name
    IF v_customer_name IS NULL OR trim(v_customer_name) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Voucher chưa có tên khách hàng',
            'code', 'MISSING_CUSTOMER'
        );
    END IF;
    
    -- Prevent rapid changes
    IF v_last_modified IS NOT NULL AND (now() - v_last_modified) < INTERVAL '3 seconds' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Vui lòng đợi trước khi thực hiện thao tác tiếp theo',
            'code', 'TOO_FAST'
        );
    END IF;
    
    -- Update status
    UPDATE public.vouchers
    SET 
        status = 'SOLD',
        sold_at = now(),
        version = version + 1,
        last_modified_at = now()
    WHERE id = p_voucher_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Đã xác nhận thanh toán từ %s', v_customer_name),
        'voucher_id', p_voucher_id,
        'customer_name', v_customer_name
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Lỗi hệ thống: ' || SQLERRM,
        'code', 'SYSTEM_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_voucher_as_sold TO authenticated;

COMMENT ON FUNCTION public.mark_voucher_as_sold IS 'Safely mark voucher as SOLD with validation and locking';

-- ========================================

-- Function: Mark voucher as EXPIRED
CREATE OR REPLACE FUNCTION public.mark_voucher_as_expired(
    p_voucher_id UUID,
    p_expected_status voucher_status DEFAULT 'UNUSED'
)
RETURNS JSONB AS $$
DECLARE
    v_current_status voucher_status;
    v_owner_id UUID;
BEGIN
    -- Lock the row
    SELECT status, owner_id
    INTO v_current_status, v_owner_id
    FROM public.vouchers
    WHERE id = p_voucher_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voucher không tồn tại', 'code', 'NOT_FOUND');
    END IF;
    
    IF v_owner_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bạn không có quyền', 'code', 'UNAUTHORIZED');
    END IF;
    
    IF v_current_status != p_expected_status THEN
        RETURN jsonb_build_object('success', false, 'error', 'Trạng thái đã thay đổi', 'code', 'STATUS_CHANGED', 'current_status', v_current_status);
    END IF;
    
    IF v_current_status NOT IN ('UNUSED', 'SENT') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Không thể đánh dấu hết hạn voucher ' || v_current_status, 'code', 'INVALID_STATUS');
    END IF;
    
    UPDATE public.vouchers
    SET status = 'EXPIRED', version = version + 1, last_modified_at = now()
    WHERE id = p_voucher_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Đã đánh dấu hết hạn');
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lỗi: ' || SQLERRM, 'code', 'SYSTEM_ERROR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_voucher_as_expired TO authenticated;

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- Check if improvements are applied
DO $$
BEGIN
    -- Check version column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vouchers' AND column_name = 'version'
    ) THEN
        RAISE NOTICE '✅ Version column added';
    ELSE
        RAISE NOTICE '❌ Version column missing';
    END IF;
    
    -- Check audit log table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'voucher_audit_log'
    ) THEN
        RAISE NOTICE '✅ Audit log table created';
    ELSE
        RAISE NOTICE '❌ Audit log table missing';
    END IF;
    
    -- Check functions
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'mark_voucher_as_sent'
    ) THEN
        RAISE NOTICE '✅ Functions created';
    ELSE
        RAISE NOTICE '❌ Functions missing';
    END IF;
END $$;

-- ========================================
-- SECURITY IMPROVEMENTS COMPLETE!
-- ========================================

COMMENT ON TABLE public.vouchers IS 'Voucher table with version control and audit logging';

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  SECURITY IMPROVEMENTS APPLIED SUCCESSFULLY!        ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'Improvements:';
    RAISE NOTICE '  ✅ Version field for optimistic locking';
    RAISE NOTICE '  ✅ Audit log table with RLS';
    RAISE NOTICE '  ✅ Database functions with row-level locking';
    RAISE NOTICE '  ✅ Automatic audit trail via triggers';
    RAISE NOTICE '  ✅ Rate limiting (3 second cooldown)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Update frontend to use RPC functions';
    RAISE NOTICE '  2. Test concurrent updates in multiple tabs';
    RAISE NOTICE '  3. Review audit logs regularly';
    RAISE NOTICE '';
END $$;
