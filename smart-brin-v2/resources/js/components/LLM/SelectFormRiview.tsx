import * as React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mendefinisikan tipe untuk setiap pilihan dalam dropdown
interface Option {
  value: string;
  label: string;
}

// Mendefinisikan properti (props) yang dibutuhkan oleh komponen ini
interface StyledSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Option[];
}

/**
 * Komponen Select yang dapat digunakan kembali dengan gaya kustom (warna merah).
 */
export function StyledSelect({ value, onValueChange, placeholder, options }: StyledSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full rounded-md border border-gray-300 p-2 focus:ring-3 focus:ring-gray-300 focus:outline-none">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-gray-100 border-2 border-gray-200 shadow-lg rounded-md text-gray-700">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[highlighted]:bg-red-100 data-[highlighted]:text-red-700"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
