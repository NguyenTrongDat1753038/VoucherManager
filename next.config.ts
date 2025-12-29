import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone', // Required for Docker deployment
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
};

export default nextConfig;
