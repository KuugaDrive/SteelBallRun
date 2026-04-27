import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { DocumentKey } from "./DocumentReviewDialog";

export const documentOptions = [
  { value: "publikasi-global", label: "Dokumen Publikasi Global" },
  { value: "kekayaan-intelektual", label: "Dokumen Kekayaan Intelektual" },
  { value: "perjanjian-kerjasama", label: "Dokumen Dana Eksternal dan PKS" },
  { value: "purwarupa", label: "Dokumen Purwarupa" },
  { value: "studi-lanjut", label: "Dokumen Studi Lanjut" },
  { value: "pdvr", label: "Dokumen Postdoctoral dan Vising Research " },
  
];

interface SelectDocumentsProps {
  value: DocumentKey | ''; // Mengizinkan string kosong
  onChange: (value: string) => void;
}

export function SelectDocuments({ value, onChange }: SelectDocumentsProps) {
  return (
    <Select value={value} onValueChange={onChange} >
      <SelectTrigger className="w-full border-2 border-gray-300 rounded-md text-gray-800 focus:ring-2 focus:ring-red-300">
        <SelectValue placeholder="-- Select Document --" />
      </SelectTrigger>
      <SelectContent className="bg-gray-100 border-2 border-gray-200 shadow-lg rounded-md text-gray-700">
        <SelectGroup >
          {documentOptions.map((doc) => (
            <SelectItem key={doc.value} value={doc.value} className="cursor-pointer data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[highlighted]:bg-red-100 data-[highlighted]:text-red-700">
              {doc.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}