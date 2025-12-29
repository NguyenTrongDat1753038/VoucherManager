'use client';

import { useState } from 'react';
import { Loader2, User, AlertCircle } from 'lucide-react';

interface CustomerNameDialogProps {
    title: string;
    message: string;
    actionText: string;
    onConfirm: (customerName: string) => Promise<void> | void;
    onCancel: () => void;
    loading?: boolean;
    voucherInfo?: {
        brand: string;
        value: number;
        type: string;
    };
}

export default function CustomerNameDialog({
    title,
    message,
    actionText,
    onConfirm,
    onCancel,
    loading = false,
    voucherInfo,
}: CustomerNameDialogProps) {
    const [customerName, setCustomerName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const trimmed = customerName.trim();

        if (!trimmed) {
            setError('Vui lòng nhập tên khách hàng');
            return;
        }

        if (trimmed.length < 2) {
            setError('Tên khách hàng quá ngắn');
            return;
        }

        setError('');
        await onConfirm(trimmed);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm">{message}</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Voucher Info */}
                    {voucherInfo && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Thông tin voucher:</span>
                            </div>
                            <div className="text-sm text-blue-800 space-y-1 ml-6">
                                <div>• Brand: <strong>{voucherInfo.brand}</strong></div>
                                <div>• Giá trị: <strong>{voucherInfo.value.toLocaleString('vi-VN')}đ</strong></div>
                                <div>• Loại: <strong>{voucherInfo.type === 'CODE' ? 'Mã code' : 'QR/Barcode'}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <strong>Quan trọng:</strong> Sau khi xác nhận, voucher sẽ chuyển sang trạng thái{' '}
                                <span className="font-bold text-yellow-900">ĐÃ GỬI</span> và được gắn với khách hàng này.
                            </div>
                        </div>
                    </div>

                    {/* Customer Name Input */}
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                            Tên khách hàng <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="customerName"
                                type="text"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={handleKeyDown}
                                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                            💡 Mẹo: Nhập tên chính xác để dễ theo dõi thanh toán
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !customerName.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Đang xử lý...' : actionText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
