'use server';

import { createClient } from '@/lib/supabase/server';

export interface ImportVoucherRow {
    brand: string;
    value: number;
    type: 'Mã CODE' | 'Link voucher';
    code: string;
    note?: string;
    image_url?: string;
}

export interface ImportResult {
    success: boolean;
    inserted: number;
    skipped: number;
    errors: string[];
    duplicates: string[];
}

export async function importVouchers(vouchers: ImportVoucherRow[]): Promise<ImportResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            inserted: 0,
            skipped: 0,
            errors: ['User not authenticated'],
            duplicates: [],
        };
    }

    const result: ImportResult = {
        success: true,
        inserted: 0,
        skipped: 0,
        errors: [],
        duplicates: [],
    };

    // Validate and prepare vouchers
    const vouchersToInsert: any[] = [];
    const codes = vouchers.map(v => v.code).filter(Boolean);

    // Check for duplicates in database (only if codes exist)
    if (codes.length > 0) {
        const { data: existingVouchers } = await supabase
            .from('vouchers')
            .select('code')
            .eq('owner_id', user.id)
            .in('code', codes);

        const existingCodes = new Set(
            ((existingVouchers || []) as any[])
                .map(v => v.code)
                .filter((code): code is string => code !== null)
        );

        for (let i = 0; i < vouchers.length; i++) {
            const voucher = vouchers[i];

            // Validation
            if (!voucher.brand || !voucher.value || !voucher.type || !voucher.code) {
                result.errors.push(`Dòng ${i + 1}: Thiếu thông tin bắt buộc (brand, value, type, code)`);
                result.skipped++;
                continue;
            }

            if (voucher.type !== 'Mã CODE' && voucher.type !== 'Link voucher') {
                result.errors.push(`Dòng ${i + 1}: Type phải là "Mã CODE" hoặc "Link voucher"`);
                result.skipped++;
                continue;
            }

            if (typeof voucher.value !== 'number' || voucher.value <= 0) {
                result.errors.push(`Dòng ${i + 1}: Value phải là số dương`);
                result.skipped++;
                continue;
            }

            // Check if code already exists
            if (existingCodes.has(voucher.code)) {
                result.duplicates.push(voucher.code);
                result.skipped++;
                continue;
            }

            // Map display type to database type
            const dbType = voucher.type === 'Mã CODE' ? 'CODE' : 'IMAGE';

            vouchersToInsert.push({
                owner_id: user.id,
                brand: voucher.brand.trim(),
                value: voucher.value,
                type: dbType,
                code: voucher.code.trim(),
                image_url: voucher.image_url?.trim() || null,
                status: 'UNUSED',
            });
        }
    }

    // Bulk insert
    if (vouchersToInsert.length > 0) {
        const { error } = await supabase
            .from('vouchers')
            .insert(vouchersToInsert as any);

        if (error) {
            result.success = false;
            result.errors.push(`Database error: ${error.message}`);
        } else {
            result.inserted = vouchersToInsert.length;
        }
    }

    return result;
}
