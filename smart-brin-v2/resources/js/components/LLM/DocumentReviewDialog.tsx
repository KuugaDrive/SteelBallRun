import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useRef, useState } from 'react';
import * as React from 'react';

import { documentOptions } from '@/components/LLM/SelectDocuments';
import type { FieldTemplate } from '../LLM/FormUploadDocument';
import { fieldTemplates } from '../LLM/FormUploadDocument';
import { StyledSelect } from '../LLM/SelectFormRiview';

export type DocumentKey = 'publikasi-global' | 'kekayaan-intelektual' | 'perjanjian-kerjasama' | 'purwarupa' | 'studi-lanjut' | 'pdvr';
export type DocumentType = 'Publikasi' | 'KI' | 'PKS' | 'Purwarupa' | 'StudiLanjut' | 'PDVR';

export type AuthorEntry = {
    nama: string;
    peran: string;
    is_internal_brin: boolean;
    user_id?: string | null;
};

export type AuthUser = {
    id: string;
    name: string;
    role: string;
};

const ADMIN_ROLES = ['admin', 'superadmin'];

const mapToDocumentType = (key: DocumentKey): DocumentType => {
    switch (key) {
        case 'publikasi-global':     return 'Publikasi';
        case 'kekayaan-intelektual': return 'KI';
        case 'perjanjian-kerjasama': return 'PKS';
        case 'purwarupa':            return 'Purwarupa';
        case 'studi-lanjut':         return 'StudiLanjut';
        case 'pdvr':                 return 'PDVR';
        default:                     return 'Publikasi';
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Author row with DB autocomplete
// ─────────────────────────────────────────────────────────────────────────────
type DbUser = { id: string; name: string };

function AuthorRow({
    author,
    index,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
    locked = false,
}: {
    author: AuthorEntry;
    index: number;
    onChange: (updated: AuthorEntry) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
    locked?: boolean; // locked = current user auto-added, cannot delete
}) {
    const [suggestions, setSuggestions] = useState<DbUser[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNameChange = (val: string) => {
        onChange({ ...author, nama: val, user_id: null });
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(val)}`, {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data = (await res.json()) as DbUser[];
                    setSuggestions(data);
                    setShowSuggestions(data.length > 0);
                }
            } catch { /* silent */ }
        }, 300);
    };

    const selectSuggestion = (user: DbUser) => {
        onChange({ ...author, nama: user.name, is_internal_brin: true, user_id: user.id });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div className={`rounded-lg border p-3 space-y-2 ${locked ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                    Urutan {index + 1}
                    {locked && <span className="ml-2 text-xs text-blue-600">(Anda)</span>}
                </span>
                <div className="flex items-center gap-2">
                    {!isFirst && (
                        <button
                            type="button"
                            onClick={onMoveUp}
                            className="text-gray-400 hover:text-gray-600 pb-1"
                            title="Pindah ke Atas"
                        >
                            ↑
                        </button>
                    )}
                    {!isLast && (
                        <button
                            type="button"
                            onClick={onMoveDown}
                            className="text-gray-400 hover:text-gray-600 pb-1"
                            title="Pindah ke Bawah"
                        >
                            ↓
                        </button>
                    )}
                    {!locked && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-red-400 hover:text-red-600 text-lg leading-none ml-2"
                            title="Hapus penulis"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Nama Penulis + Autocomplete */}
            <div ref={wrapperRef} className="relative">
                <Label className="text-xs text-gray-600">
                    Nama Penulis <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={author.nama}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={locked ? 'Nama Anda (dari session)' : 'Ketik nama atau cari dari database...'}
                    disabled={locked}
                    className={`mt-1 rounded-md border text-sm ${locked ? 'border-blue-200 bg-blue-50 text-gray-700' : 'border-gray-300'}`}
                />
                {showSuggestions && (
                    <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg text-sm max-h-40 overflow-y-auto">
                        {suggestions.map((u) => (
                            <li
                                key={u.id}
                                className="cursor-pointer px-3 py-2 hover:bg-red-50 hover:text-[#E62F2A]"
                                onMouseDown={() => selectSuggestion(u)}
                            >
                                {u.name}
                                <span className="ml-2 text-xs text-green-600">(Internal BRIN)</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Peran + Internal BRIN */}
            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <Label className="text-xs text-gray-600">Peran</Label>
                    <select
                        value={author.peran}
                        onChange={(e) => onChange({ ...author, peran: e.target.value })}
                        className="mt-1 h-9 w-full rounded-md border border-gray-300 px-2 text-sm"
                    >
                        <option value="First Author">First Author</option>
                        <option value="Co-Author">Co-Author</option>
                        <option value="Corresponding Author">Corresponding Author</option>
                    </select>
                </div>

                <div className="flex flex-col items-center gap-1 pb-0.5">
                    <Label className="text-xs text-gray-600 whitespace-nowrap">Internal BRIN</Label>
                    <button
                        type="button"
                        onClick={() => !locked && onChange({ ...author, is_internal_brin: !author.is_internal_brin, user_id: author.is_internal_brin ? null : author.user_id })}
                        className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
                            author.is_internal_brin ? 'bg-[#E62F2A]' : 'bg-gray-300'
                        } ${locked ? 'cursor-default opacity-75' : ''}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                author.is_internal_brin ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse LLM author array
// ─────────────────────────────────────────────────────────────────────────────
function parseAuthorList(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return (raw as unknown[]).map(String).filter(Boolean);
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dialog
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Record<string, unknown>) => void;
    metadata: Record<string, unknown>;
    setMetadata: (data: Record<string, unknown>) => void;
    documentKey: DocumentKey;
    mode: 'review' | 'manual';
    authUser?: AuthUser | null;
}

// Fields that are handled separately in the Publikasi dialog
const AUTHOR_FIELD_NAMES = ['authorsCivitasPRSDI', 'authorsNonCivitasPRSDI'];
// Fields rendered before the author section
const FIELDS_BEFORE_AUTHORS = ['judul'];
// Fields rendered after the author section (everything else)

export function DocumentReviewDialog({ open, onClose, onSubmit, metadata, setMetadata, documentKey, mode, authUser }: Props) {
    const documentType = mapToDocumentType(documentKey);
    const isPublikasi = documentKey === 'publikasi-global';
    const isAdmin = !!authUser && ADMIN_ROLES.includes(authUser.role);

    // ── Authors state ──────────────────────────────────────────────────────
    const [authors, setAuthors] = useState<AuthorEntry[]>([]);
    
    // ── Publikasi Types state ─────────────────────────────────────────────
    const [publikasiTypes, setPublikasiTypes] = useState<{value: string, label: string}[]>([]);

    useEffect(() => {
        if (!isPublikasi || !open) return;

        // Try reading the new 'authors' array format first
        let loadedAuthors: AuthorEntry[] = [];
        
        const rawAuthors = metadata['authors'];
        if (Array.isArray(rawAuthors) && rawAuthors.length > 0) {
            loadedAuthors = rawAuthors.map((a: any, i: number) => ({
                nama: a?.nama || '',
                peran: i === 0 ? 'First Author' : 'Co-Author',
                is_internal_brin: Boolean(a?.is_internal_brin),
                user_id: null,
            }));
        } else {
            // Fallback to old format just in case
            const internalRaw = parseAuthorList(metadata['authorsCivitasPRSDI']);
            const externalRaw = parseAuthorList(metadata['authorsNonCivitasPRSDI']);
            if (internalRaw.length > 0 || externalRaw.length > 0) {
                loadedAuthors = [
                    ...internalRaw.map((nama, i) => ({
                        nama,
                        peran: i === 0 ? 'First Author' : 'Co-Author',
                        is_internal_brin: true,
                        user_id: null,
                    })),
                    ...externalRaw.map((nama) => ({
                        nama,
                        peran: 'Co-Author',
                        is_internal_brin: false,
                        user_id: null,
                    })),
                ];
            }
        }

        if (loadedAuthors.length === 0) {
            // Manual mode or no LLM data: seed from current user if non-admin
            if (!isAdmin && authUser) {
                setAuthors([{ nama: authUser.name, peran: 'First Author', is_internal_brin: true, user_id: authUser.id }]);
            } else {
                setAuthors([{ nama: '', peran: 'First Author', is_internal_brin: false }]);
            }
            return;
        }

        setAuthors(loadedAuthors);

        // Auto-resolve user IDs for internal authors in the background
        loadedAuthors.forEach(async (author, index) => {
            if (author.is_internal_brin && !author.user_id && author.nama.trim().length > 2) {
                try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(author.nama.trim())}`, {
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    });
                    if (res.ok) {
                        const data = (await res.json()) as DbUser[];
                            // 1. Try exact match (case-insensitive)
                            let match = data.find(u => u.name.toLowerCase() === author.nama.toLowerCase());
                            
                            // 2. Try word-boundary match (e.g. "Diana" shouldn't match "Hadiana")
                            if (!match) {
                                try {
                                    // Escape regex characters just in case
                                    const escapedNama = author.nama.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    const regex = new RegExp(`\\b${escapedNama}\\b`, 'i');
                                    
                                    // Find first user whose name contains the search term as a distinct word
                                    match = data.find(u => regex.test(u.name));
                                } catch (e) {
                                    // Ignore regex errors
                                }
                            }

                            if (match) {
                                setAuthors(prev => prev.map((a, i) => 
                                    i === index ? { ...a, nama: match.name, user_id: match.id } : a
                                ));
                            }
                    }
                } catch { /* silent fail */ }
            }
        });


        // Fetch Publikasi Types from Backend API
        const fetchPublikasiTypes = async () => {
            try {
                const res = await fetch('/api/master/publikasi-types');
                if (res.ok) {
                    const data = await res.json();
                    setPublikasiTypes(data);
                }
            } catch (error) {
                console.error('Gagal mengambil jenis publikasi:', error);
            }
        };

        fetchPublikasiTypes();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isPublikasi]);

    const addAuthor = () =>
        setAuthors((prev) => [
            ...prev,
            { nama: '', peran: prev.length === 0 ? 'First Author' : 'Co-Author', is_internal_brin: false },
        ]);

    const updateAuthor = (i: number, updated: AuthorEntry) =>
        setAuthors((prev) => prev.map((a, idx) => (idx === i ? updated : a)));

    const removeAuthor = (i: number) =>
        setAuthors((prev) => prev.filter((_, idx) => idx !== i));

    const moveAuthorUp = (i: number) => {
        if (i === 0) return;
        setAuthors((prev) => {
            const next = [...prev];
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
            return next;
        });
    };

    const moveAuthorDown = (i: number) => {
        if (i === authors.length - 1) return;
        setAuthors((prev) => {
            const next = [...prev];
            [next[i], next[i + 1]] = [next[i + 1], next[i]];
            return next;
        });
    };

    // ── Field change ────────────────────────────────────────────────────────
    const handleChange = (key: string, value: string) => setMetadata({ ...metadata, [key]: value });

    // ── Dialog title ────────────────────────────────────────────────────────
    const fullDocumentTitle = React.useMemo(() => {
        const option = documentOptions.find((opt) => opt.value === documentKey);
        return option ? `REVIEW ${option.label.toUpperCase()}` : `REVIEW DOKUMEN ${documentType.toUpperCase()}`;
    }, [documentKey, documentType]);

    if (!metadata) return null;

    // Build field lists for non-publikasi or split for publikasi
    const allFields: FieldTemplate[] = (fieldTemplates[documentType] || []).filter(
        (f) => !isPublikasi || !AUTHOR_FIELD_NAMES.includes(f.name),
    );
    const fieldsBefore = isPublikasi ? allFields.filter((f) => FIELDS_BEFORE_AUTHORS.includes(f.name)) : allFields;
    const fieldsAfter  = isPublikasi ? allFields.filter((f) => !FIELDS_BEFORE_AUTHORS.includes(f.name)) : [];

    const dialogTitle = mode === 'manual' ? 'Form Input Manual' : fullDocumentTitle;
    const dialogDescription =
        mode === 'manual'
            ? 'Silakan isi semua data yang diperlukan di bawah ini.'
            : 'Silakan cek kembali dan lengkapi data yang kosong.';

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...metadata, authors });
    };

    const renderField = (field: FieldTemplate) => {
        // Inject API dropdown for Jenis Dokumen if available
        let currentOptions = field.options || [];
        if (isPublikasi && field.name === 'jenisDokumen/Jurnal/Prosiding/Bagbook' && publikasiTypes.length > 0) {
            currentOptions = publikasiTypes;
        }

        return (
            <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                    {field.link && (
                        <span className="ml-2">
                            <a href={field.link.url} target="_blank" rel="noopener noreferrer"
                                className="text-sm text-blue-600 underline hover:text-blue-800">
                                ({field.link.text})
                            </a>
                        </span>
                    )}
                </Label>
                {field.type === 'select' ? (
                    <StyledSelect
                        value={(metadata[field.name] as string) || ''}
                        onValueChange={(value) => handleChange(field.name, value)}
                        placeholder={`-- Pilih ${field.label} --`}
                        options={currentOptions}
                    />
                ) : field.type === 'textarea' ? (
                    <textarea
                        id={field.name}
                        value={(metadata[field.name] as string) || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        rows={field.name === 'abstrak' ? 5 : 3}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                    />
                ) : (
                    <Input
                        id={field.name}
                        type={field.type}
                        value={(metadata[field.name] as string) || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                )}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="scrollbar-hidden max-h-[90vh] w-full overflow-y-scroll bg-white text-black sm:max-w-[600px] md:ml-[105px] [&>button]:hidden"
            >
                <form onSubmit={handleFormSubmit}>
                    <DialogHeader className="font-poppins items-center text-[#E62F2A]">
                        <DialogTitle className="items-center text-center">{dialogTitle}</DialogTitle>
                        <DialogDescription className="mt-2">{dialogDescription}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* ── Fields BEFORE authors (Judul) ─────────────── */}
                        {fieldsBefore.map(renderField)}

                        {/* ── Dynamic Author Section (Publikasi only) ─────── */}
                        {isPublikasi && (
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>
                                        Daftar Penulis <span className="text-red-500">*</span>
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={addAuthor}
                                        className="rounded-md border border-[#E62F2A] px-3 py-1 text-xs text-[#E62F2A] hover:bg-red-50"
                                    >
                                        + Tambah Penulis
                                    </button>
                                </div>

                                {!isAdmin && (
                                    <p className="text-xs text-gray-400 italic">
                                        Nama Anda otomatis ditambahkan berdasarkan sesi login. Gunakan tombol panah (↑/↓) untuk mengatur urutan dan pilih Peran yang sesuai.
                                    </p>
                                )}

                                {authors.length === 0 && (
                                    <p className="text-xs text-gray-400 italic">Belum ada penulis. Klik tombol di atas untuk menambah.</p>
                                )}

                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {authors.map((author, i) => {
                                        // A row is locked (name uneditable) if non-admin and it belongs to the current user.
                                        // Removing the i === 0 check so it stays locked even when moved down.
                                        const isLockedRow = !isAdmin && !!authUser && author.user_id === authUser.id;
                                        return (
                                            <AuthorRow
                                                key={`${author.user_id || 'manual'}-${i}`}
                                                author={author}
                                                index={i}
                                                locked={isLockedRow}
                                                isFirst={i === 0}
                                                isLast={i === authors.length - 1}
                                                onChange={(updated) => updateAuthor(i, updated)}
                                                onRemove={() => removeAuthor(i)}
                                                onMoveUp={() => moveAuthorUp(i)}
                                                onMoveDown={() => moveAuthorDown(i)}
                                            />
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400">
                                    💡 Ketik nama untuk mencari dari database. Nama yang cocok akan otomatis ditandai sebagai Internal BRIN.
                                </p>
                            </div>
                        )}

                        {/* ── Fields AFTER authors (Jenis, Status, Jurnal, Tahun, dsb.) ── */}
                        {fieldsAfter.map(renderField)}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline"
                                className="cursor-pointer bg-[#fdaaa8] text-white hover:bg-[#E62F2A] hover:text-white">
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
