'use client';

import type { Database } from '@/lib/supabase/database.types';
import { Package, TrendingUp, Clock, DollarSign } from 'lucide-react';

type Voucher = Database['public']['Tables']['vouchers']['Row'];

interface StatsOverviewProps {
    vouchers: Voucher[];
}

export default function StatsOverview({ vouchers }: StatsOverviewProps) {
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
        },
        {
            label: 'Chưa dùng',
            value: stats.unused,
            icon: TrendingUp,
            color: 'bg-gradient-to-br from-purple-500 to-purple-600',
            subtext: `${stats.unusedValue.toLocaleString('vi-VN')}đ`,
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
                        <div className="text-xs font-medium text-blue-600">{stat.subtext}</div>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết trạng thái</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <StatBadge label="Chưa dùng" value={stats.unused} color="green" />
                    <StatBadge label="Đã gửi" value={stats.sent} color="yellow" />
                    <StatBadge label="Đã bán" value={stats.sold} color="blue" />
                    <StatBadge label="Đã dùng" value={stats.used} color="purple" />
                    <StatBadge label="Hết hạn" value={stats.expired} color="red" />
                </div>
            </div>
        </div>
    );
}

function StatBadge({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    const colorClasses = {
        green: 'bg-green-100 text-green-700 ring-green-600/20',
        yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20',
        blue: 'bg-blue-100 text-blue-700 ring-blue-600/20',
        purple: 'bg-purple-100 text-purple-700 ring-purple-600/20',
        red: 'bg-red-100 text-red-700 ring-red-600/20',
    }[color];

    return (
        <div className="text-center">
            <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ring-2 ring-inset ${colorClasses} mb-2`}
            >
                {value}
            </div>
            <div className="text-xs text-gray-600 font-medium">{label}</div>
        </div>
    );
}
