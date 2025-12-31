'use client';

import { X, TrendingUp, DollarSign, Package } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Voucher = Database['public']['Tables']['vouchers']['Row'];

interface BrandDetailModalProps {
    brand: string;
    vouchers: Voucher[];
    onClose: () => void;
}

export default function BrandDetailModal({ brand, vouchers, onClose }: BrandDetailModalProps) {
    // Group vouchers by denomination (value)
    const breakdown = vouchers.reduce((acc, v) => {
        const val = v.value;
        if (!acc[val]) {
            acc[val] = { count: 0, sold: 0, unused: 0, totalValue: 0 };
        }
        acc[val].count++;
        acc[val].totalValue += val;
        if (v.status === 'SOLD') acc[val].sold++;
        if (v.status === 'UNUSED') acc[val].unused++;
        return acc;
    }, {} as Record<number, { count: number; sold: number; unused: number; totalValue: number }>);

    // Sort by Total Value descending (most impactful first)
    const sortedBreakdown = Object.entries(breakdown)
        .map(([value, data]) => ({ value: Number(value), ...data }))
        .sort((a, b) => b.totalValue - a.totalValue);

    const totalValue = vouchers.reduce((sum, v) => sum + v.value, 0);
    const totalCount = vouchers.length;
    const totalUnused = vouchers.filter(v => v.status === 'UNUSED').length;
    const totalSold = vouchers.filter(v => v.status === 'SOLD').length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-200" />
                        {brand}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-100">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">Tổng giá trị</div>
                        <div className="text-lg font-bold text-gray-900">{totalValue.toLocaleString('vi-VN')}đ</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-green-200 shadow-sm bg-green-50/50">
                        <div className="text-xs text-green-600 font-medium mb-1">Sẵn sàng bán</div>
                        <div className="text-lg font-bold text-green-700">{totalUnused} <span className="text-xs font-normal text-green-600">vouchers</span></div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm bg-blue-50/50">
                        <div className="text-xs text-blue-600 font-medium mb-1">Đã bán</div>
                        <div className="text-lg font-bold text-blue-700">{totalSold} <span className="text-xs font-normal text-blue-600">vouchers</span></div>
                    </div>
                </div>

                {/* Detail Table */}
                <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Chi tiết theo mệnh giá</h4>

                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mệnh giá</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn (Unused)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đã bán</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedBreakdown.map((row) => (
                                    <tr key={row.value} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {row.value.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                            {row.count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {row.unused > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {row.unused}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {row.sold > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {row.sold}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                            {row.totalValue.toLocaleString('vi-VN')}đ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
