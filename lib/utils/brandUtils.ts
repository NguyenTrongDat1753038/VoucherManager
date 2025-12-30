import brandsData from '@/lib/data/brands.json';

interface Brand {
    id: number;
    title: string;
    logo: string | null;
}

const brands = brandsData as Brand[];

/**
 * Get brand logo URL by brand name
 * Supports fuzzy matching for better UX
 */
export function getBrandLogo(brandName: string): string | null {
    if (!brandName) return null;

    const normalizedName = brandName.toLowerCase().trim();

    // Try exact match first
    let brand = brands.find(
        (b) => b.title.toLowerCase() === normalizedName
    );

    // If no exact match, try partial match
    if (!brand) {
        brand = brands.find((b) =>
            b.title.toLowerCase().includes(normalizedName)
        );
    }

    return brand?.logo || null;
}

/**
 * Get brand info by brand name
 */
export function getBrandInfo(brandName: string): Brand | null {
    if (!brandName) return null;

    const normalizedName = brandName.toLowerCase().trim();

    // Try exact match first
    let brand = brands.find(
        (b) => b.title.toLowerCase() === normalizedName
    );

    // If no exact match, try partial match
    if (!brand) {
        brand = brands.find((b) =>
            b.title.toLowerCase().includes(normalizedName)
        );
    }

    return brand || null;
}
