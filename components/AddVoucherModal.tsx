'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Upload, Loader2 } from 'lucide-react';
import { BrandAutocomplete } from '@/components/BrandAutocomplete';

interface AddVoucherModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddVoucherModal({ userId, onClose, onSuccess }: AddVoucherModalProps) {
    const [brand, setBrand] = useState('');
    const [value, setValue] = useState('');
    const [type, setType] = useState<'CODE' | 'IMAGE'>('CODE');
    const [code, setCode] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null); // Preview URL
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');
    const supabase = createClient();

    // Cleanup preview URL on unmount or when file changes
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File ảnh không được vượt quá 5MB');
                return;
            }

            // Cleanup old preview
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }

            // Create new preview
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setImageFile(file);
            setError('');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let imageUrl = null;

            // Upload image if type is IMAGE
            if (type === 'IMAGE' && imageFile) {
                setUploadProgress('Đang upload ảnh...');
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${userId}/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('voucher-images')
                    .upload(fileName, imageFile);

                if (uploadError) {
                    throw new Error('Upload ảnh thất bại: ' + uploadError.message);
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('voucher-images')
                    .getPublicUrl(uploadData.path);

                imageUrl = urlData.publicUrl;
                setUploadProgress('');
            }

            // Validate
            if (type === 'CODE' && !code.trim()) {
                setError('Vui lòng nhập mã code');
                setLoading(false);
                return;
            }

            if (type === 'IMAGE' && !imageUrl) {
                setError('Vui lòng chọn ảnh');
                setLoading(false);
                return;
            }

            // Insert voucher
            setUploadProgress('Đang lưu voucher...');
            const { error: insertError } = await supabase.from('vouchers').insert({
                brand: brand.trim(),
                value: parseInt(value),
                type,
                code: type === 'CODE' ? code.trim() : null,
                image_url: type === 'IMAGE' ? imageUrl : null,
                owner_id: userId,
                status: 'UNUSED',
            });

            if (insertError) {
                throw new Error('Lưu voucher thất bại: ' + insertError.message);
            }

            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Thêm voucher mới</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Brand */}
                    <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                            Thương hiệu <span className="text-red-500">*</span>
                        </label>
                        <BrandAutocomplete
                            value={brand}
                            onValueChange={setBrand}
                            placeholder="Chọn hoặc nhập tên thương hiệu..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            💡 Chọn từ 400+ brands hoặc gõ tên mới rồi nhấn Enter
                        </p>
                    </div>

                    {/* Value */}
                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                            Mệnh giá (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="value"
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="100000"
                            min="1000"
                            step="1000"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loại voucher <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('CODE')}
                                className={`p-4 border-2 rounded-lg transition-all ${type === 'CODE'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                disabled={loading}
                            >
                                <div className="font-medium">Mã CODE</div>
                                <div className="text-xs mt-1 opacity-75">Text code</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('IMAGE')}
                                className={`p-4 border-2 rounded-lg transition-all ${type === 'IMAGE'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                disabled={loading}
                            >
                                <div className="font-medium">QR/Barcode</div>
                                <div className="text-xs mt-1 opacity-75">Ảnh</div>
                            </button>
                        </div>
                    </div>

                    {/* CODE Input */}
                    {type === 'CODE' && (
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Mã code <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                                placeholder="ABCD1234EFGH5678"
                                required={type === 'CODE'}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* IMAGE Upload */}
                    {type === 'IMAGE' && (
                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                                Ảnh QR/Barcode <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                                <label
                                    htmlFor="image"
                                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-all bg-gray-50 hover:bg-blue-50"
                                >
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {imageFile ? imageFile.name : 'Chọn ảnh từ thiết bị'}
                                    </span>
                                </label>
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    required={type === 'IMAGE'}
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP (tối đa 5MB)</p>
                            </div>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">👁️ Xem trước:</p>
                                    <div className="relative w-full max-w-sm mx-auto border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-auto object-contain"
                                            style={{ maxHeight: '300px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (imagePreview) {
                                                    URL.revokeObjectURL(imagePreview);
                                                }
                                                setImagePreview(null);
                                                setImageFile(null);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            disabled={loading}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploadProgress && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                            {uploadProgress}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Đang lưu...' : 'Thêm voucher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
