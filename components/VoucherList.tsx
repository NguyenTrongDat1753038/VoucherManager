'use client';

import type { Database } from '@/lib/supabase/database.types';
import VoucherCard from './VoucherCard';
import { Loader2, PackageX } from 'lucide-react';

type Voucher = Database['public']['Tables']['vouchers']['Row'];

interface VoucherListProps {
    vouchers: Voucher[];
    loading: boolean;
    onRefresh: () => void;
    activeTab: string;
}

export default function VoucherList({ vouchers, loading, onRefresh, activeTab }: VoucherListProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Đang tải vouchers...</p>
            </div>
        );
    }

    if (vouchers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                <PackageX className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-xl font-medium text-gray-900 mb-2">
                    Không có voucher nào
                </p>
                <p className="text-gray-600">
                    {activeTab === 'UNUSED'
                        ? 'Thêm voucher mới để bắt đầu'
                        : `Chưa có voucher nào ở trạng thái ${activeTab}`}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher) => (
                <VoucherCard key={voucher.id} voucher={voucher} onUpdate={onRefresh} />
            ))}
        </div>
    );
}
