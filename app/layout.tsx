import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Voucher Manager - Quản lý voucher chuyên nghiệp",
    description: "Hệ thống quản lý voucher cho sellers - Traveloka, Golden Gate, Highlands và nhiều thương hiệu khác",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
