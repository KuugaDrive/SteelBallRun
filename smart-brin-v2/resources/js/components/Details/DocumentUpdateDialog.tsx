import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as React from 'react';

import { documentOptions } from '@/components/LLM/SelectDocuments';
import type { FieldTemplate } from '../LLM/FormUploadDocument';
import { fieldTemplates } from '../LLM/FormUploadDocument';
import { StyledSelect } from '../LLM/SelectFormRiview';

export type DocumentKey = 'publikasi-global' | 'kekayaan-intelektual' | 'perjanjian-kerjasama' | 'purwarupa' | 'studi-lanjut' | 'pdvr';

export type DocumentType = 'Publikasi' | 'KI' | 'PKS' | 'Purwarupa' | 'StudiLanjut' | 'PDVR';

// Mapping untuk menerjemahkan tipe dokumen dari URL ke tipe yang digunakan oleh fieldTemplates
const mapTypeToDocumentType = (type: string): DocumentType => {
    switch (type) {
        case 'publication':
            return 'Publikasi';
        case 'ki':
            return 'KI';
        case 'pks':
            return 'PKS';
        case 'purwarupa':
            return 'Purwarupa';
        case 'loa':
            return 'StudiLanjut';
        case 'pdvr':
            return 'PDVR';
        default:
            return 'Publikasi';
    }
};

// Mapping untuk menerjemahkan tipe dokumen ke DocumentKey
const mapTypeToDocumentKey = (type: string): DocumentKey => {
    switch (type) {
        case 'publication':
            return 'publikasi-global';
        case 'ki':
            return 'kekayaan-intelektual';
        case 'pks':
            return 'perjanjian-kerjasama';
        case 'purwarupa':
            return 'purwarupa';
        case 'loa':
            return 'studi-lanjut';
        case 'pdvr':
            return 'pdvr';
        default:
            return 'publikasi-global';
    }
};

interface DocumentUpdateDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, string>) => void;
    documentData: Record<string, unknown>;
    documentType: string;
}

export function DocumentUpdateDialog({ open, onClose, onSubmit, documentData, documentType }: DocumentUpdateDialogProps) {
    const [formData, setFormData] = React.useState<Record<string, string>>({});
    
    // Konversi tipe dokumen ke format yang dikenali oleh fieldTemplates
    const docType = mapTypeToDocumentType(documentType);
    const documentKey = mapTypeToDocumentKey(documentType);
    
    // Mengisi formData dengan data dokumen yang ada saat dialog terbuka
    React.useEffect(() => {
        if (open && documentData) {
            const initialData: Record<string, string> = {};
            
            // Mengisi initialData dengan nilai dari documentData
            // Mengubah properti sesuai dengan nama field di fieldTemplates
            if (fieldTemplates[docType]) {
                fieldTemplates[docType].forEach((field) => {
                    // Coba ambil data dari documentData berdasarkan label field
                    // atau berdasarkan nama field
                    const value = documentData[field.label] !== undefined 
                        ? documentData[field.label] 
                        : (documentData[field.name] !== undefined 
                            ? documentData[field.name] 
                            : '');
                    
                    initialData[field.name] = String(value !== null && value !== undefined ? value : '');
                });
            }
            
            setFormData(initialData);
        }
    }, [open, documentData, docType]);

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
    };

    const fullDocumentTitle = React.useMemo(() => {
        const option = documentOptions.find((opt) => opt.value === documentKey);
        return option ? `UPDATE ${option.label.toUpperCase()}` : `UPDATE DOKUMEN ${docType.toUpperCase()}`;
    }, [documentKey, docType]);

    if (!documentData) return null;

    const fields: FieldTemplate[] = fieldTemplates[docType] || [];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="scrollbar-hidden max-h-[90vh] w-full overflow-y-scroll bg-white text-black sm:max-w-[600px] md:ml-[105px] [&>button]:hidden"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        
                        // Validasi form data (tambahkan validasi jika perlu)
                        const requiredFields = fieldTemplates[docType]
                            .filter(field => field.required)
                            .map(field => field.name);
                        
                        const missingFields = requiredFields.filter(field => !formData[field]);
                        
                        if (missingFields.length > 0) {
                            alert(`Mohon lengkapi kolom berikut: ${missingFields.join(', ')}`);
                            return;
                        }
                        
                        onSubmit(formData);
                    }}
                >
                    <DialogHeader className="font-poppins items-center text-[#E62F2A]">
                        <DialogTitle className='items-center text-center'>{fullDocumentTitle}</DialogTitle>
                        <DialogDescription className="mt-2">
                            Silakan cek kembali dan perbarui data yang diperlukan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {fields.map((field) => (
                            <div key={field.name} className="grid gap-2">
                                <Label htmlFor={field.name}>{field.label}</Label>
                                {field.type === 'select' ? (
                                    <StyledSelect
                                        value={formData[field.name] || ''}
                                        onValueChange={(value) => handleChange(field.name, value)}
                                        placeholder={`-- Pilih ${field.label} --`}
                                        options={field.options || []}
                                    />
                                ) : (
                                    <Input
                                        id={field.name}
                                        type={field.type}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        placeholder={field.placeholder || ''}
                                        className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="cursor-pointer bg-[#fdaaa8] text-white hover:text-white hover:bg-[#E62F2A]">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="cursor-pointer bg-[#fdaaa8] text-white hover:bg-[#E62F2A]">
                            Submit
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
