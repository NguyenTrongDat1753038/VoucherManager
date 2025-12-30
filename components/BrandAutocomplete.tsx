'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import brandsData from '@/lib/data/brands.json';

interface Brand {
    id: number;
    title: string;
    logo: string | null;
}

interface BrandAutocompleteProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
}

export function BrandAutocomplete({
    value,
    onValueChange,
    placeholder = 'Chọn hoặc nhập tên thương hiệu...',
}: BrandAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState('');
    const brands = brandsData as Brand[];

    // Normalize Vietnamese text for better search
    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // Find brand by exact title match
    const selectedBrand = brands.find(
        (brand) => brand.title.toLowerCase() === value.toLowerCase()
    );

    // Filter brands based on search
    const filteredBrands = React.useMemo(() => {
        if (!searchValue) return brands;
        const normalizedSearch = normalizeText(searchValue);
        return brands.filter((brand) =>
            normalizeText(brand.title).includes(normalizedSearch)
        );
    }, [searchValue, brands]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Gõ tên thương hiệu..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                        onKeyDown={(e) => {
                            // Allow Enter to use custom value if no exact match
                            if (e.key === 'Enter' && searchValue.trim()) {
                                e.preventDefault();
                                const exactMatch = brands.find(
                                    (b) => b.title.toLowerCase() === searchValue.toLowerCase()
                                );
                                if (!exactMatch) {
                                    // Use custom brand name
                                    onValueChange(searchValue.trim());
                                    setSearchValue('');
                                    setOpen(false);
                                }
                            }
                        }}
                    />
                    <CommandList>
                        {filteredBrands.length === 0 && searchValue ? (
                            <div className="p-4 text-sm text-gray-500 space-y-2">
                                <p>Không tìm thấy &quot;{searchValue}&quot; trong danh sách.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onValueChange(searchValue.trim());
                                        setSearchValue('');
                                        setOpen(false);
                                    }}
                                    className="w-full px-3 py-2 text-left bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
                                >
                                    ✨ Sử dụng &quot;{searchValue}&quot;
                                </button>
                            </div>
                        ) : (
                            <CommandGroup>
                                {filteredBrands.map((brand) => (
                                    <CommandItem
                                        key={brand.id}
                                        value={brand.title}
                                        onSelect={(currentValue) => {
                                            onValueChange(currentValue);
                                            setSearchValue('');
                                            setOpen(false);
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <Check
                                            className={cn(
                                                'h-4 w-4',
                                                value.toLowerCase() === brand.title.toLowerCase()
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        {brand.logo && (
                                            <img
                                                src={brand.logo}
                                                alt={brand.title}
                                                className="h-6 w-6 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <span>{brand.title}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
