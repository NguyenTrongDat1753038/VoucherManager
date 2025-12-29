export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type VoucherStatus = 'UNUSED' | 'SENT' | 'SOLD' | 'USED' | 'EXPIRED';
export type VoucherType = 'CODE' | 'IMAGE';

export interface Database {
    public: {
        Tables: {
            vouchers: {
                Row: {
                    id: string;
                    brand: string;
                    value: number;
                    type: VoucherType;
                    code: string | null;
                    image_url: string | null;
                    status: VoucherStatus;
                    customer_name: string | null;
                    sent_at: string | null;
                    sold_at: string | null;
                    created_at: string;
                    owner_id: string;
                };
                Insert: {
                    id?: string;
                    brand: string;
                    value: number;
                    type: VoucherType;
                    code?: string | null;
                    image_url?: string | null;
                    status?: VoucherStatus;
                    customer_name?: string | null;
                    sent_at?: string | null;
                    sold_at?: string | null;
                    created_at?: string;
                    owner_id: string;
                };
                Update: {
                    id?: string;
                    brand?: string;
                    value?: number;
                    type?: VoucherType;
                    code?: string | null;
                    image_url?: string | null;
                    status?: VoucherStatus;
                    customer_name?: string | null;
                    sent_at?: string | null;
                    sold_at?: string | null;
                    created_at?: string;
                    owner_id?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            voucher_status: VoucherStatus;
            voucher_type: VoucherType;
        };
    };
}
