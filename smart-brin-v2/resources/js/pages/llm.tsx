import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CloudUpload, FileText, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import patternBg from '../assets/bg-pattern3.png';

import { DocumentKey, DocumentReviewDialog } from '@/components/LLM/DocumentReviewDialog';
import { SelectDocuments } from '@/components/LLM/SelectDocuments';
import { usePage } from '@inertiajs/react';

/**
 * Fungsi untuk mengubah format tanggal dari "30 September 2024" menjadi "2024-09-30"
 */
const formatDateStringForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString.replace(/(\d+)\s(\w+)\s(\d+)/, '$2 $1, $3'));
    if (isNaN(date.getTime())) {
        const directDate = new Date(dateString);
        if (isNaN(directDate.getTime())) return dateString;
        return dateString;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Helper function to get a cookie by its name.
 */
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

export default function Llm() {
    const [metadata, setMetadata] = useState<Record<string, unknown>>({});
    const [showReview, setShowReview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogMode, setDialogMode] = useState<'review' | 'manual'>('review');

    const { props } = usePage<{ auth: { user: { id: string; name: string; role: string } | null } }>();
    const authUser = props.auth?.user ?? null;

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Administrative Document Submission', href: '/upload-documents' }];

    const [selectedDocument, setSelectedDocument] = useState<DocumentKey | ''>('');
    const [mainFile, setMainFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState<{ document?: string; file?: string }>({});

    const handleDocumentChange = (value: string) => {
        setSelectedDocument(value as DocumentKey | '');
    };

    const handleDrag = (e: React.DragEvent<HTMLLabelElement>, isActive: boolean) => {
        e.preventDefault();
        setDragActive(isActive);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        setDragActive(false);
        if (file) {
            setMainFile(file);
        }
    };

    const formatFileSize = (size: number) => (size < 1024 * 1024 ? `${(size / 1024).toFixed(2)} KB` : `${(size / 1024 / 1024).toFixed(2)} MB`);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const MAX_SIZE = 10 * 1024 * 1024;
        const newErrors: typeof errors = {};

        if (!selectedDocument) newErrors.document = 'Document type is required.';
        if (!mainFile) {
            newErrors.file = 'Main file is required.';
        } else if (mainFile.size > MAX_SIZE) {
            newErrors.file = 'Main file size must not exceed 10MB.';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsLoading(true);
        setDialogMode('review');

        const formData = new FormData();
        formData.append('file', mainFile!);
        formData.append('documentKey', selectedDocument);

        try {
            const res = await fetch('/api/extract-metadata', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to extract metadata from the server.');
            }

            const data = await res.json();
            const receivedMetadata = data.metadata as Record<string, unknown>;
            // Format tanggal yang ada di dalam metadata
            Object.keys(receivedMetadata).forEach((key) => {
                if (key.toLowerCase().includes('tanggal') && typeof receivedMetadata[key] === 'string') {
                    receivedMetadata[key] = formatDateStringForInput(receivedMetadata[key] as string);
                }
            });

            setMetadata(receivedMetadata);
            setShowReview(true);
        } catch (err) {
            if (err instanceof Error) {
                toast.error('Failed Extraction', { description: err.message });
            } else {
                toast.error('An unknown error occurred.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualInput = () => {
        if (!selectedDocument) {
            setErrors({ document: 'Please select a document type first to open the manual form.' });
            return;
        }
        setErrors({});
        setMetadata({});
        setDialogMode('manual');
        setShowReview(true);
    };

    const handleFinalSubmit = async (finalData: Record<string, unknown>) => {
        setIsSubmitting(true);
        const toastId = toast.loading('Please wait, saving data...');

        try {
            const xsrfToken = getCookie('XSRF-TOKEN');
            const response = await fetch('http://127.0.0.1:8000/api/save-document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                },
                body: JSON.stringify({
                    documentKey: selectedDocument,
                    metadata: finalData,
                }),
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join('\n') : result.message;
                throw new Error(errorMessages || 'Failed to save data to the server.');
            }

            toast.success(`Success! Data has been saved by ${result.user_name}`, {
                id: toastId,
            });

            setShowReview(false);
            setMainFile(null);
            setSelectedDocument('');
            setMetadata({});
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';

            toast.error(`Failed to save: ${errorMessage}`, {
                id: toastId,
                style: {
                    background: '#ffffff',
                    color: '#EF4444',
                },
            });
            console.error('Submit Error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Document" />
            <div
                className="flex flex-col flex-1 h-full gap-4 p-6 overflow-x-auto rounded-xl"
                style={{ backgroundImage: `url(${patternBg})`}}
            >
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="mb-2 text-xl font-bold text-[#E62F2A] md:text-3xl">Administrative Document Submission</h2>
                    <p className="text-sm text-gray-600 sm:text-md">
                        Select the document type, then upload the file for automatic extraction or choose manual input.
                    </p>
                </div>

                <div className="w-full max-w-lg p-6 mx-auto bg-white shadow-lg rounded-2xl shadow-gray-400">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <fieldset disabled={isLoading || isSubmitting} className="space-y-6 disabled:opacity-70">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    Select Document Type <span className="text-red-500">*</span>
                                </label>
                                <SelectDocuments value={selectedDocument} onChange={handleDocumentChange} />
                                {errors.document && <p className="mt-1 text-sm text-red-600">{errors.document}</p>}
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    Upload Main File <span className="text-sm text-gray-400">(for automatic extraction)</span>
                                </label>
                                <label
                                    htmlFor="mainFile"
                                    onDragOver={(e) => handleDrag(e, true)}
                                    onDragLeave={(e) => handleDrag(e, false)}
                                    onDrop={(e) => handleDrop(e)}
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200 ${
                                        dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 text-gray-500 hover:border-red-500'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        id="mainFile"
                                        onChange={(e) => setMainFile(e.target.files?.[0] || null)}
                                    />
                                    <label htmlFor="mainFile" className="cursor-pointer">
                                        <CloudUpload className="w-8 h-8 mx-auto text-red-400" />
                                        <p className="mt-2 text-sm">Drag or click to upload file</p>
                                        <p className="text-xs text-gray-400">Format: .pdf (max. 10MB)</p>
                                    </label>
                                </label>
                                {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
                                {mainFile && (
                                    <div className="flex items-center justify-between px-4 py-2 mt-3 text-sm text-blue-800 border border-blue-200 rounded-md bg-blue-50">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium underline">{mainFile.name}</span>
                                            <span className="ml-1 text-gray-500">({formatFileSize(mainFile.size)})</span>
                                        </div>
                                        <button type="button" onClick={() => setMainFile(null)} className="text-red-500 hover:text-red-700">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                            <button
                                type="submit"
                                disabled={isLoading || isSubmitting || !mainFile}
                                className="flex w-full cursor-pointer items-center justify-center rounded-md bg-[#E62F2A] py-3 font-bold text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>Extract & Review</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleManualInput}
                                disabled={isLoading || isSubmitting}
                                className="flex w-full cursor-pointer items-center justify-center rounded-md bg-[#E62F2A] py-3 font-bold text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                            >
                                Manual Input
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {showReview && (
                <DocumentReviewDialog
                    open={showReview}
                    onClose={() => setShowReview(false)}
                    metadata={metadata}
                    setMetadata={setMetadata}
                    onSubmit={handleFinalSubmit}
                    documentKey={selectedDocument as DocumentKey}
                    mode={dialogMode}
                    authUser={authUser}
                />
            )}
        </AppLayout>
    );
}
