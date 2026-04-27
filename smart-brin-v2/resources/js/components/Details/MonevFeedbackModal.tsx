import React, { useState, useEffect } from 'react';

const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

interface MonevFeedbackModalProps {
    isOpen: boolean;
    documentNo: string | undefined;
    documentType: string;
    currentNotes: string;
    currentStatus: string;
    isLocked: boolean;
    revisionCount: number;
    isStamped: boolean;
    onClose: () => void;
}

export function MonevFeedbackModal({
    isOpen,
    documentNo,
    documentType,
    currentNotes,
    currentStatus,
    isLocked,
    revisionCount,
    isStamped,
    onClose,
}: MonevFeedbackModalProps) {
    const [notes, setNotes] = useState(currentNotes);
    const [status, setStatus] = useState(currentStatus);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNotes(currentNotes);
            setStatus(currentStatus);
            setError('');
        }
    }, [currentNotes, currentStatus, isOpen]);

    const handleSave = async () => {
        if (!documentNo || String(documentNo).trim() === '') {
            setError('ID dokumen tidak valid. Coba tutup dialog lalu buka kembali.');
            return;
        }

        // Validasi: notes harus diisi sebelum status dipilih
        if (!notes.trim()) {
            setError('Harap isi alasan/catatan terlebih dahulu sebelum memilih status');
            return;
        }

        if (!status || status === '-') {
            setError('Harap pilih status');
            return;
        }

        setSaving(true);
        try {
            const xsrfToken = getCookie('XSRF-TOKEN');
            if (!xsrfToken) {
                setError('Error: XSRF-TOKEN tidak ditemukan. Coba refresh halaman.');
                setSaving(false);
                return;
            }

            const response = await fetch(
                `/details/update/${documentType}/${documentNo}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        monev_notes: notes,
                        monev_status: status,
                    }),
                    credentials: 'same-origin',
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Server error: ${error}`);
            }

            alert('Catatan dan status berhasil disimpan. Klik tombol "Stamp Monev" untuk mengunci.');
            onClose();
            window.location.reload();
        } catch (error) {
            setError(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <h2 className="mb-2 text-lg font-bold text-[#E62F2A]">
                    Feedback Monev
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                    Dokumen: {documentType} (No. {documentNo})
                </p>

                {isLocked && (
                    <div className="mb-4 rounded bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                        <strong>Status:</strong> Dokumen terkunci (menunggu revisi dari researcher).
                        <br />
                        <strong>Revision count:</strong> {revisionCount}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alasan/Catatan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full rounded border border-gray-300 p-2 text-sm font-sans"
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Masukkan alasan/catatan untuk researcher..."
                        rows={4}
                        disabled={isStamped}
                        style={{
                            backgroundColor: isStamped ? '#f3f4f6' : 'white',
                            color: isStamped ? '#9ca3af' : 'black',
                        }}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full rounded border border-gray-300 p-2 text-sm font-sans"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            if (error) setError('');
                        }}
                        disabled={isStamped || !notes.trim()}
                        style={{
                            backgroundColor: (isStamped || !notes.trim()) ? '#f3f4f6' : 'white',
                            color: (isStamped || !notes.trim()) ? '#9ca3af' : 'black',
                        }}
                    >
                        <option value="">-- Pilih Status --</option>
                        <option value="approved">✓ Approved (Disetujui)</option>
                        <option value="rejected">✗ Rejected (Ditolak)</option>
                        <option value="needs_revision">⟳ Needs Revision (Perlu Revisi)</option>
                    </select>
                    {!notes.trim() && (
                        <p className="text-xs text-orange-600 mt-1">
                            ℹ Isi catatan/alasan terlebih dahulu untuk pilih status
                        </p>
                    )}
                </div>

                {isStamped && (
                    <div className="mb-4 rounded bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                        ✓ Sudah di-stamp oleh monev. Status dan alasan terkunci.
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        ⚠ {error}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={saving}
                    >
                        Close
                    </button>
                    {!isStamped && (
                        <button
                            onClick={handleSave}
                            disabled={saving || !notes.trim() || !status}
                            className="flex-1 rounded bg-[#E62F2A] px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
