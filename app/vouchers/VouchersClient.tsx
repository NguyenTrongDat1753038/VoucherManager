'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Search, Download, BarChart3, Upload } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';
import VoucherList from '@/components/VoucherList';
import AddVoucherModal from '@/components/AddVoucherModal';
import StatsOverview from '@/components/StatsOverview';
import ImportVoucherDialog from '@/components/ImportVoucherDialog';

type Voucher = Database['public']['Tables']['vouchers']['Row'];
type VoucherStatus = 'UNUSED' | 'SENT' | 'SOLD' | 'USED' | 'EXPIRED';

interface VouchersClientProps {
    user: User;
}

export default function VouchersClient({ user }: VouchersClientProps) {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
    const [activeTab, setActiveTab] = useState<VoucherStatus>('UNUSED');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Fetch vouchers
    useEffect(() => {
        fetchVouchers();
    }, []);

    // Filter vouchers by search and tab
    useEffect(() => {
        let filtered = vouchers.filter((v) => v.status === activeTab);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (v) =>
                    v.brand.toLowerCase().includes(query) ||
                    v.customer_name?.toLowerCase().includes(query) ||
                    v.code?.toLowerCase().includes(query) ||
                    v.value.toString().includes(query)
            );
        }

        setFilteredVouchers(filtered);
    }, [vouchers, activeTab, searchQuery]);

    const fetchVouchers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setVouchers(data);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleExport = () => {
        const csv = [
            ['Brand', 'Value', 'Type', 'Status', 'Code', 'Customer', 'Sent At', 'Sold At', 'Created At'].join(','),
            ...filteredVouchers.map((v) =>
                [
                    v.brand,
                    v.value,
                    v.type,
                    v.status,
                    v.code || '',
                    v.customer_name || '',
                    v.sent_at || '',
                    v.sold_at || '',
                    v.created_at,
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vouchers-${activeTab}-${new Date().toISOString()}.csv`;
        a.click();
    };

    const tabs: VoucherStatus[] = ['UNUSED', 'SENT', 'SOLD'];

    const getTabColor = (status: VoucherStatus) => {
        switch (status) {
            case 'UNUSED':
                return 'bg-green-500';
            case 'SENT':
                return 'bg-yellow-500';
            case 'SOLD':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getTabCount = (status: VoucherStatus) => {
        return vouchers.filter((v) => v.status === status).length;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Voucher Manager
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Thống kê"
                            >
                                <BarChart3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Import CSV"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleExport}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Xuất CSV"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                {showStats && <StatsOverview vouchers={vouchers} onStatusClick={setActiveTab} />}

                {/* Search & Add */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo brand, customer, code hoặc value..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm voucher
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-white shadow-lg ring-2 ring-blue-500 text-gray-900'
                                : 'bg-white/60 hover:bg-white text-gray-600 hover:shadow'
                                }`}
                        >
                            <span className={`w-3 h-3 rounded-full ${getTabColor(tab)}`} />
                            <span>{tab}</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {getTabCount(tab)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Voucher List */}
                <VoucherList
                    vouchers={filteredVouchers}
                    loading={loading}
                    onRefresh={fetchVouchers}
                    activeTab={activeTab}
                />
            </main>

            {/* Add Voucher Modal */}
            {showAddModal && (
                <AddVoucherModal
                    userId={user.id}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        fetchVouchers();
                        setShowAddModal(false);
                    }}
                />
            )}

            {/* Import Voucher Dialog */}
            {showImportModal && (
                <ImportVoucherDialog
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        fetchVouchers();
                        setShowImportModal(false);
                    }}
                />
            )}
        </div>
    );
}
