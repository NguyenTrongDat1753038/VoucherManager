'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { getBrandLogo } from '@/lib/utils/brandUtils';
import {
    Copy,
    Download,
    Check,
    DollarSign,
    Clock,
    AlertTriangle,
    Image as ImageIcon,
    Code2,
    Ban,
    Loader2,
    Lock,
    ShieldAlert,
} from 'lucide-react';
import Image from 'next/image';
import ConfirmDialog from './ConfirmDialog';
import CustomerNameDialog from './CustomerNameDialog';

type Voucher = Database['public']['Tables']['vouchers']['Row'];

interface VoucherCardProps {
    voucher: Voucher;
    onUpdate: () => void;
}

export default function VoucherCard({ voucher, onUpdate }: VoucherCardProps) {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [showCustomerDialog, setShowCustomerDialog] = useState(false);
    const [showSoldDialog, setShowSoldDialog] = useState(false);
    const [showExpiredDialog, setShowExpiredDialog] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    const canEdit = voucher.status === 'UNUSED' || voucher.status === 'SENT';
    const isReadOnly = voucher.status === 'SOLD' || voucher.status === 'USED';
    const isLocked = loading || actionInProgress !== null;

    // Copy code - shows customer name dialog FIRST
    const handleCopy = async () => {
        if (!voucher.code) return;

        setActionInProgress('Nhấn để copy...');

        try {
            await navigator.clipboard.writeText(voucher.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // Show customer name dialog
            setShowCustomerDialog(true);
            setActionInProgress(null);
        } catch (err) {
            setError('Không thể copy code. Vui lòng thử lại.');
            setActionInProgress(null);
        }
    };

    // Download image - shows customer name dialog FIRST
    const handleDownload = () => {
        if (!voucher.image_url) return;

        setActionInProgress('Đang mở ảnh...');
        window.open(voucher.image_url, '_blank');

        // Show customer name dialog
        setTimeout(() => {
            setShowCustomerDialog(true);
            setActionInProgress(null);
        }, 500);
    };

    // Mark as SENT using secure RPC function
    const handleMarkAsSent = async (customerName: string) => {
        setLoading(true);
        setError('');

        try {
            const { data, error: rpcError } = await supabase.rpc('mark_voucher_as_sent', {
                p_voucher_id: voucher.id,
                p_customer_name: customerName,
                p_expected_status: voucher.status,
            } as any);

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            // Check if function returned success
            if (data && typeof data === 'object' && 'success' in data) {
                const result = data as any;
                if (!result.success) {
                    // Handle specific error codes
                    const errorCode = result.code as string;
                    let errorMessage = result.error as string;

                    if (errorCode === 'STATUS_CHANGED') {
                        errorMessage = `${errorMessage}\n\nTrạng thái hiện tại: ${result.current_status}`;
                    } else if (errorCode === 'TOO_FAST') {
                        errorMessage = 'Bạn đang thao tác quá nhanh. Vui lòng đợi 3 giây.';
                    }

                    setError(errorMessage);
                    // Refresh to get latest status
                    setTimeout(() => onUpdate(), 500);
                    return;
                }
            }

            // Success
            onUpdate();
            setShowCustomerDialog(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
            // Refresh to sync state
            setTimeout(() => onUpdate(), 500);
        } finally {
            setLoading(false);
        }
    };

    // Mark as SOLD using secure RPC function
    const handleMarkAsSold = async () => {
        setLoading(true);
        setError('');

        try {
            const { data, error: rpcError } = await supabase.rpc('mark_voucher_as_sold', {
                p_voucher_id: voucher.id,
                p_expected_status: voucher.status,
            } as any);

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            if (data && typeof data === 'object' && 'success' in data) {
                const result = data as any;
                if (!result.success) {
                    const errorCode = result.code as string;
                    let errorMessage = result.error as string;

                    if (errorCode === 'STATUS_CHANGED') {
                        errorMessage = `${errorMessage}\n\nVui lòng làm mới trang.`;
                    }

                    setError(errorMessage);
                    setTimeout(() => onUpdate(), 500);
                    return;
                }
            }

            onUpdate();
            setShowSoldDialog(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
            setTimeout(() => onUpdate(), 500);
        } finally {
            setLoading(false);
        }
    };

    // Mark as EXPIRED using secure RPC function
    const handleMarkAsExpired = async () => {
        setLoading(true);
        setError('');

        try {
            const { data, error: rpcError } = await supabase.rpc('mark_voucher_as_expired', {
                p_voucher_id: voucher.id,
                p_expected_status: voucher.status,
            } as any);

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            if (data && typeof data === 'object' && 'success' in data) {
                const result = data as any;
                if (!result.success) {
                    setError(result.error as string);
                    setTimeout(() => onUpdate(), 500);
                    return;
                }
            }

            onUpdate();
            setShowExpiredDialog(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
            setTimeout(() => onUpdate(), 500);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => {
        const badges = {
            UNUSED: { color: 'bg-green-100 text-green-700 ring-green-600/20', label: '🟢 Chưa dùng' },
            SENT: {
                color: 'bg-yellow-100 text-yellow-700 ring-yellow-600/20',
                label: '🟡 Đã gửi (Rủi ro)',
            },
            SOLD: { color: 'bg-blue-100 text-blue-700 ring-blue-600/20', label: '🔵 Đã bán' },
            USED: { color: 'bg-purple-100 text-purple-700 ring-purple-600/20', label: '🟣 Đã dùng' },
            EXPIRED: { color: 'bg-red-100 text-red-700 ring-red-600/20', label: '🔴 Hết hạn' },
        };

        const badge = badges[voucher.status];
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <>
            <div
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 ${voucher.status === 'SENT' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-transparent'
                    } ${isReadOnly ? 'opacity-75' : ''} ${isLocked ? 'pointer-events-none opacity-70' : ''}`}
            >
                {/* Enhanced Warning for SENT status */}
                {voucher.status === 'SENT' && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0 animate-pulse" />
                            <div>
                                <p className="text-sm font-bold text-yellow-900 mb-1">
                                    ⚠️ CẢNH BÁO: VOUCHER ĐÃ GỬI - CẦN THEO DÕI!
                                </p>
                                <p className="text-xs text-yellow-800">
                                    Voucher đã được gửi cho khách nhưng <strong>chưa thanh toán</strong>.
                                    Vui lòng xác nhận thanh toán ngay khi nhận được tiền để tránh rủi ro!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action In Progress Indicator */}
                {actionInProgress && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-700 font-medium">{actionInProgress}</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
                        <button
                            onClick={() => {
                                setError('');
                                onUpdate();
                            }}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                            Làm mới trang
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        {/* Brand Logo */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border border-gray-200">
                            {getBrandLogo(voucher.brand) ? (
                                <img
                                    src={getBrandLogo(voucher.brand)!}
                                    alt={voucher.brand}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        // Fallback to text logo on error
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<span class="text-lg font-bold text-blue-600">${voucher.brand.charAt(0)}</span>`;
                                        }
                                    }}
                                />
                            ) : (
                                <span className="text-lg font-bold text-blue-600">
                                    {voucher.brand.charAt(0)}
                                </span>
                            )}
                        </div>

                        {/* Brand Name & Value */}
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{voucher.brand}</h3>
                            <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                                <DollarSign className="w-5 h-5" />
                                {voucher.value.toLocaleString('vi-VN')}đ
                            </div>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Type Badge */}
                <div className="flex items-center gap-2 mb-4">
                    {voucher.type === 'CODE' ? (
                        <>
                            <Code2 className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">Mã code</span>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">QR/Barcode</span>
                        </>
                    )}
                </div>

                {/* Voucher Content */}
                <div className="mb-4">
                    {voucher.type === 'CODE' && voucher.code && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Code:</p>
                            <p className="font-mono text-sm font-bold text-gray-900 break-all">{voucher.code}</p>
                        </div>
                    )}

                    {voucher.type === 'IMAGE' && voucher.image_url && (
                        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <Image
                                src={voucher.image_url}
                                alt={`${voucher.brand} voucher`}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Customer Info */}
                {voucher.customer_name && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Khách hàng:</p>
                        <p className="text-sm font-medium text-blue-900">{voucher.customer_name}</p>
                        {voucher.sent_at && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                                <Clock className="w-3 h-3" />
                                Gửi: {new Date(voucher.sent_at).toLocaleString('vi-VN')}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    {canEdit && (
                        <>
                            {voucher.type === 'CODE' && voucher.code && (
                                <button
                                    onClick={handleCopy}
                                    disabled={isLocked}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Đã copy!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy code
                                        </>
                                    )}
                                </button>
                            )}

                            {voucher.type === 'IMAGE' && voucher.image_url && (
                                <button
                                    onClick={handleDownload}
                                    disabled={isLocked}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Xem/Tải ảnh
                                </button>
                            )}

                            {voucher.status === 'SENT' && (
                                <button
                                    onClick={() => setShowSoldDialog(true)}
                                    disabled={isLocked}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="w-4 h-4" />
                                            Đánh dấu đã bán
                                        </>
                                    )}
                                </button>
                            )}

                            {voucher.status === 'UNUSED' && (
                                <button
                                    onClick={() => setShowExpiredDialog(true)}
                                    disabled={isLocked}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <Ban className="w-4 h-4" />
                                    Đánh dấu hết hạn
                                </button>
                            )}
                        </>
                    )}

                    {isReadOnly && (
                        <div className="text-center p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                            <Lock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-700">🔒 Voucher đã khóa</p>
                            <p className="text-xs text-gray-500 mt-1">Không thể chỉnh sửa</p>
                        </div>
                    )}
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    Tạo: {new Date(voucher.created_at).toLocaleString('vi-VN')}
                    {voucher.sold_at && (
                        <div className="mt-1">Bán: {new Date(voucher.sold_at).toLocaleString('vi-VN')}</div>
                    )}
                </div>
            </div>

            {/* Customer Name Dialog (shown BEFORE marking as sent) */}
            {showCustomerDialog && (
                <CustomerNameDialog
                    title="Xác nhận gửi voucher"
                    message={`Bạn vừa ${voucher.type === 'CODE' ? 'copy code' : 'xem ảnh'}. Xác nhận bạn đã gửi cho khách hàng?`}
                    actionText="Xác nhận đã gửi"
                    onConfirm={handleMarkAsSent}
                    onCancel={() => {
                        setShowCustomerDialog(false);
                        setError('');
                    }}
                    loading={loading}
                    voucherInfo={{
                        brand: voucher.brand,
                        value: voucher.value,
                        type: voucher.type,
                    }}
                />
            )}

            {/* Sold Confirmation Dialog */}
            {showSoldDialog && (
                <ConfirmDialog
                    title="Xác nhận đã bán"
                    message={`Xác nhận khách hàng "${voucher.customer_name}" đã thanh toán?\n\n⚠️ Sau khi xác nhận, voucher sẽ bị KHÓA và không thể sửa.`}
                    confirmText={loading ? 'Đang xử lý...' : 'Đã thanh toán'}
                    cancelText="Chưa"
                    onConfirm={handleMarkAsSold}
                    onCancel={() => {
                        setShowSoldDialog(false);
                        setError('');
                    }}
                    loading={loading}
                />
            )}

            {/* Expired Confirmation Dialog */}
            {showExpiredDialog && (
                <ConfirmDialog
                    title="Đánh dấu hết hạn"
                    message="Xác nhận voucher này đã hết hạn sử dụng?"
                    confirmText={loading ? 'Đang xử lý...' : 'Đã hết hạn'}
                    cancelText="Hủy"
                    onConfirm={handleMarkAsExpired}
                    onCancel={() => {
                        setShowExpiredDialog(false);
                        setError('');
                    }}
                    loading={loading}
                />
            )}
        </>
    );
}
