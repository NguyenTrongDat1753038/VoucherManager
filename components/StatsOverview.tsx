'use client';

import { useState } from 'react';
import type { Database } from '@/lib/supabase/database.types';
import { Package, TrendingUp, Clock, DollarSign } from 'lucide-react';
import BrandDetailModal from './BrandDetailModal';

type Voucher = Database['public']['Tables']['vouchers']['Row'];
type VoucherStatus = 'UNUSED' | 'SENT' | 'SOLD' | 'USED' | 'EXPIRED';

interface StatsOverviewProps {
    vouchers: Voucher[];
    onStatusClick?: (status: VoucherStatus) => void;
}

export default function StatsOverview({ vouchers, onStatusClick }: StatsOverviewProps) {
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    const stats = {
        total: vouchers.length,
        unused: vouchers.filter((v) => v.status === 'UNUSED').length,
        sent: vouchers.filter((v) => v.status === 'SENT').length,
        sold: vouchers.filter((v) => v.status === 'SOLD').length,
        used: vouchers.filter((v) => v.status === 'USED').length,
        expired: vouchers.filter((v) => v.status === 'EXPIRED').length,

        totalValue: vouchers.reduce((sum, v) => sum + v.value, 0),
        soldValue: vouchers
            .filter((v) => v.status === 'SOLD')
            .reduce((sum, v) => sum + v.value, 0),
        unusedValue: vouchers
            .filter((v) => v.status === 'UNUSED')
            .reduce((sum, v) => sum + v.value, 0),
        sentValue: vouchers
            .filter((v) => v.status === 'SENT')
            .reduce((sum, v) => sum + v.value, 0),
    };

    // Calculate percentages for KPIs
    const soldPercentage = stats.total > 0 ? ((stats.sold / stats.total) * 100).toFixed(1) : '0';
    const unusedPercentage = stats.total > 0 ? ((stats.unused / stats.total) * 100).toFixed(1) : '0';

    // Group by brand with sold/unused breakdown
    const brandStats = vouchers.reduce((acc, voucher) => {
        const brand = voucher.brand || 'Unknown';
        if (!acc[brand]) {
            acc[brand] = { count: 0, value: 0, sold: 0, unused: 0 };
        }
        acc[brand].count++;
        acc[brand].value += voucher.value;
        if (voucher.status === 'SOLD') acc[brand].sold++;
        if (voucher.status === 'UNUSED') acc[brand].unused++;
        return acc;
    }, {} as Record<string, { count: number; value: number; sold: number; unused: number }>);

    // Group by denomination (value) - only count UNUSED vouchers
    const unusedVouchers = vouchers.filter(v => v.status === 'UNUSED');
    const denominationStats = unusedVouchers.reduce((acc, voucher) => {
        const value = voucher.value;
        if (!acc[value]) {
            acc[value] = { count: 0, totalValue: 0 };
        }
        acc[value].count++;
        acc[value].totalValue += value;
        return acc;
    }, {} as Record<number, { count: number; totalValue: number }>);

    // Sort brands by total value descending
    const sortedBrands = Object.entries(brandStats).sort((a, b) => b[1].value - a[1].value);

    // Sort denominations by count descending (to show popular ones first)
    const sortedDenominations = Object.entries(denominationStats)
        .map(([value, data]) => ({
            value: Number(value),
            count: data.count,
            totalValue: data.totalValue,
            percentage: stats.unused > 0 ? (data.count / stats.unused) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

    // Find top brand and denomination for insight
    const topBrand = sortedBrands[0];
    const topDenomination = sortedDenominations[0];
    const topBrandPercentage = topBrand && stats.total > 0
        ? ((topBrand[1].count / stats.total) * 100).toFixed(0)
        : '0';
    const topDenominationPercentage = topDenomination
        ? topDenomination.percentage.toFixed(0)
        : '0';

    // Max value for progress bar scaling
    const maxBrandValue = sortedBrands[0]?.[1].value || 1;

    const statCards = [
        {
            label: 'Tổng vouchers',
            value: stats.total,
            icon: Package,
            color: 'bg-gradient-to-br from-blue-500 to-blue-600',
            subtext: `${stats.totalValue.toLocaleString('vi-VN')}đ`,
        },
        {
            label: 'Đã bán',
            value: stats.sold,
            icon: DollarSign,
            color: 'bg-gradient-to-br from-green-500 to-green-600',
            subtext: `${stats.soldValue.toLocaleString('vi-VN')}đ`,
            percentage: `${soldPercentage}%`,
        },
        {
            label: 'Chưa dùng',
            value: stats.unused,
            icon: TrendingUp,
            color: 'bg-gradient-to-br from-purple-500 to-purple-600',
            subtext: `${stats.unusedValue.toLocaleString('vi-VN')}đ`,
            percentage: `${unusedPercentage}%`,
        },
        {
            label: 'Đã gửi (chờ TT)',
            value: stats.sent,
            icon: Clock,
            color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
            subtext: `${stats.sentValue.toLocaleString('vi-VN')}đ`,
        },
    ];

    return (
        <div className="mb-8 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-blue-600">{stat.subtext}</div>
                            {'percentage' in stat && (
                                <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {stat.percentage}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết trạng thái</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <StatBadge
                        label="Chưa dùng"
                        value={stats.unused}
                        color="green"
                        onClick={() => onStatusClick?.('UNUSED')}
                        tooltip="Voucher chưa sử dụng, có thể bán"
                    />
                    <StatBadge
                        label="Đã gửi"
                        value={stats.sent}
                        color="yellow"
                        onClick={() => onStatusClick?.('SENT')}
                        tooltip="Voucher đã gửi khách, chờ thanh toán"
                    />
                    <StatBadge
                        label="Đã bán"
                        value={stats.sold}
                        color="blue"
                        onClick={() => onStatusClick?.('SOLD')}
                        tooltip="Voucher đã bán và thanh toán"
                    />
                    <StatBadge
                        label="Đã dùng"
                        value={stats.used}
                        color="purple"
                        onClick={() => onStatusClick?.('USED')}
                        tooltip="Voucher đã được sử dụng"
                    />
                    <StatBadge
                        label="Hết hạn"
                        value={stats.expired}
                        color="red"
                        onClick={() => onStatusClick?.('EXPIRED')}
                        tooltip="Voucher đã hết hạn"
                    />
                </div>
            </div>

            {/* Smart Insight Summary */}
            {topBrand && topDenomination && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-500 rounded-lg p-2 mt-0.5">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">📌 Insight nhanh</h4>
                            <p className="text-sm text-gray-700">
                                Kho voucher tập trung chủ yếu ở <strong className="text-blue-700">{topBrand[0]}</strong> ({topBrandPercentage}% tổng số)
                                với mệnh giá phổ biến nhất là <strong className="text-blue-700">{topDenomination.value.toLocaleString('vi-VN')}đ</strong> ({topDenominationPercentage}% tổng số voucher).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê theo Brand</h3>
                {sortedBrands.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedBrands.map(([brand, data], index) => {
                            const isTopBrand = index === 0 && data.count > 10;
                            const progressPercentage = (data.value / maxBrandValue) * 100;
                            const sellThroughRate = data.count > 0 ? (data.sold / data.count) * 100 : 0;

                            // Determine sell status
                            const getSellStatus = (rate: number) => {
                                if (rate >= 50) return { label: 'Bán tốt', icon: '🟢', color: 'text-green-700' };
                                if (rate >= 25) return { label: 'Trung bình', icon: '🟡', color: 'text-yellow-700' };
                                return { label: 'Bán chậm', icon: '🔴', color: 'text-red-700' };
                            };
                            const sellStatus = getSellStatus(sellThroughRate);

                            return (
                                <div
                                    key={brand}
                                    onClick={() => setSelectedBrand(brand)}
                                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 truncate">{brand}</h4>
                                            {isTopBrand && (
                                                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                    🔥 Chính
                                                </span>
                                            )}
                                        </div>
                                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                                            {data.count}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-2">
                                        Tổng giá trị:{' '}
                                        <span className="font-semibold text-green-600">
                                            {data.value.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>

                                    {/* Sold/Unused Breakdown */}
                                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-300">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600">🟢</span>
                                                <span className="text-gray-600">Bán: <strong className="text-green-700">{data.sold}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-purple-600">⚪</span>
                                                <span className="text-gray-600">Unused: <strong className="text-purple-700">{data.unused}</strong></span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1 ${sellStatus.color}`} title={sellStatus.label}>
                                            <span>{sellStatus.icon}</span>
                                            <span className="font-semibold">{sellThroughRate.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Denomination Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê theo Mệnh giá (Còn trong kho)</h3>
                {sortedDenominations.length === 0 ? (
                    <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {sortedDenominations.map(({ value, count, percentage }, index) => {
                            const isMostPopular = index === 0;
                            const isHighStock = percentage > 30;

                            return (
                                <div
                                    key={value}
                                    className={`rounded-lg p-4 border hover:shadow-md transition-shadow text-center ${isMostPopular
                                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300'
                                        : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                                        }`}
                                >
                                    {isMostPopular && (
                                        <div className="mb-2">
                                            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">
                                                🔥 Phổ biến nhất
                                            </span>
                                        </div>
                                    )}
                                    {!isMostPopular && isHighStock && (
                                        <div className="mb-2">
                                            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                                                ⚠ Tồn nhiều
                                            </span>
                                        </div>
                                    )}
                                    <div className={`text-lg font-bold mb-1 ${isMostPopular ? 'text-amber-900' : 'text-purple-900'
                                        }`}>
                                        {value.toLocaleString('vi-VN')}đ
                                    </div>
                                    <div className={`text-sm mb-1 ${isMostPopular ? 'text-amber-700' : 'text-purple-700'
                                        }`}>
                                        <span className="font-semibold">{count}</span> voucher{count > 1 ? 's' : ''}
                                    </div>
                                    <div className={`text-xs font-medium ${isMostPopular ? 'text-amber-600' : 'text-purple-600'
                                        }`}>
                                        {percentage.toFixed(1)}% tổng số
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Brand Detail Modal */}
            {selectedBrand && (
                <BrandDetailModal
                    brand={selectedBrand}
                    vouchers={vouchers.filter(v => (v.brand || 'Unknown') === selectedBrand)}
                    onClose={() => setSelectedBrand(null)}
                />
            )}
        </div>
    );
}

function StatBadge({
    label,
    value,
    color,
    onClick,
    tooltip,
}: {
    label: string;
    value: number;
    color: string;
    onClick?: () => void;
    tooltip?: string;
}) {
    const colorClasses = {
        green: 'bg-green-100 text-green-700 ring-green-600/20 hover:bg-green-200',
        yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20 hover:bg-yellow-200',
        blue: 'bg-blue-100 text-blue-700 ring-blue-600/20 hover:bg-blue-200',
        purple: 'bg-purple-100 text-purple-700 ring-purple-600/20 hover:bg-purple-200',
        red: 'bg-red-100 text-red-700 ring-red-600/20 hover:bg-red-200',
    }[color];

    return (
        <div
            className="text-center"
            onClick={onClick}
            title={tooltip}
        >
            <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ring-2 ring-inset ${colorClasses} mb-2 ${onClick ? 'cursor-pointer transition-all' : ''}`}
            >
                {value}
            </div>
            <div className="text-xs text-gray-600 font-medium">{label}</div>
        </div>
    );
}
