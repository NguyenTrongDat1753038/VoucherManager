'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, X, AlertCircle, CheckCircle2, FileText, Download } from 'lucide-react';
import { importVouchers, type ImportVoucherRow, type ImportResult } from '@/app/vouchers/actions';

interface ImportVoucherDialogProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportVoucherDialog({ onClose, onSuccess }: ImportVoucherDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportVoucherRow[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');
        setResult(null);

        // Parse CSV
        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed = results.data as any[];

                // Convert and validate
                const vouchers: ImportVoucherRow[] = parsed.map((row) => ({
                    brand: row.brand || '',
                    value: parseFloat(row.value) || 0,
                    type: row.type || 'Mã CODE',
                    code: row.code || '',
                    note: row.note || '',
                    image_url: row.image_url || '',
                }));

                setPreview(vouchers);

                if (vouchers.length === 0) {
                    setError('File CSV không có dữ liệu hợp lệ');
                }
            },
            error: (err) => {
                setError(`Lỗi đọc file: ${err.message}`);
            },
        });
    };

    const handleImport = async () => {
        if (preview.length === 0) {
            setError('Không có dữ liệu để import');
            return;
        }

        setIsImporting(true);
        setError('');

        try {
            const importResult = await importVouchers(preview);
            setResult(importResult);

            if (importResult.success && importResult.inserted > 0) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi import vouchers');
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csv = `brand,value,type,code,note,image_url
Traveloka,100000,Mã CODE,TRVLK2024,Hết hạn 31/12,
Shopee,50000,Mã CODE,SHOPEE50K,,
Grab,200000,Link voucher,https://grab.com/voucher/abc,VIP user only,`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voucher_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Upload className="w-6 h-6 text-blue-400" />
                            Import Vouchers từ CSV
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Upload file CSV để nhập hàng loạt voucher
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Download Template */}
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-white font-semibold mb-1">File CSV mẫu</h3>
                                <p className="text-slate-400 text-sm mb-3">
                                    Tải file CSV mẫu để xem format đúng. Các cột bắt buộc: brand, value, type, code
                                </p>
                                <button
                                    onClick={downloadTemplate}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Tải file mẫu
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-white font-medium mb-2">Chọn file CSV</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="block w-full text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer cursor-pointer bg-slate-800 border border-slate-700 rounded-lg"
                            />
                        </div>
                        {file && (
                            <p className="mt-2 text-sm text-slate-400">
                                ✓ Đã chọn: <span className="text-white font-medium">{file.name}</span>
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-medium">Lỗi</p>
                                <p className="text-red-300 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {preview.length > 0 && !result && (
                        <div className="mb-6">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Preview ({preview.length} vouchers)
                            </h3>
                            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-slate-300 font-semibold">#</th>
                                                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Brand</th>
                                                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Value</th>
                                                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Type</th>
                                                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Code</th>
                                                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.slice(0, 10).map((v, idx) => (
                                                <tr key={idx} className="border-t border-slate-700">
                                                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-3 text-white">{v.brand || '—'}</td>
                                                    <td className="px-4 py-3 text-white">{v.value?.toLocaleString() || '—'}</td>
                                                    <td className="px-4 py-3 text-white">{v.type || '—'}</td>
                                                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{v.code || '—'}</td>
                                                    <td className="px-4 py-3 text-slate-400 text-xs">{v.note || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {preview.length > 10 && (
                                    <div className="px-4 py-3 bg-slate-700/30 text-slate-400 text-sm text-center">
                                        ... và {preview.length - 10} vouchers khác
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="mb-6 space-y-4">
                            {result.success && result.inserted > 0 && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                    <div>
                                        <p className="text-green-400 font-medium">Import thành công!</p>
                                        <p className="text-green-300 text-sm mt-1">
                                            Đã thêm {result.inserted} vouchers
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result.skipped > 0 && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-yellow-400 font-medium mb-2">
                                        Đã bỏ qua {result.skipped} vouchers
                                    </p>
                                    {result.duplicates.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-yellow-300 text-sm mb-1">Vouchers trùng:</p>
                                            <div className="text-xs text-yellow-200 font-mono max-h-32 overflow-y-auto">
                                                {result.duplicates.slice(0, 10).join(', ')}
                                                {result.duplicates.length > 10 && ` ... và ${result.duplicates.length - 10} khác`}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {result.errors.length > 0 && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-red-400 font-medium mb-2">Lỗi:</p>
                                    <div className="text-sm text-red-300 space-y-1 max-h-32 overflow-y-auto">
                                        {result.errors.slice(0, 10).map((err, idx) => (
                                            <div key={idx}>• {err}</div>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <div>... và {result.errors.length - 10} lỗi khác</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium"
                    >
                        {result?.success && result.inserted > 0 ? 'Đóng' : 'Hủy'}
                    </button>
                    {!result && (
                        <button
                            onClick={handleImport}
                            disabled={preview.length === 0 || isImporting}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isImporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang import...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Import {preview.length} vouchers
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
