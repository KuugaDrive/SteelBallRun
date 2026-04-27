# IMPLEMENTASI MONEV FEEDBACK WORKFLOW - Ringkasan Perubahan

## Tanggal: 21 Januari 2026

### 📋 Overview
Implementasi workflow feedback monev yang baru dengan validasi ketat, locking mechanism, dan tracking revisi untuk dokumen yang ditolak atau memerlukan revisi.

---

## 🔄 WORKFLOW BARU - MONEV FEEDBACK

### Kondisi Sebelumnya:
- Monev bisa update status langsung tanpa memberikan alasan
- Monev stamp harus di-klik manual
- Dokumen approved tidak bisa diubah (tidak ada opsi revisi)
- Tidak ada tracking untuk revisi atau resubmit

### Kondisi Baru:

#### 1. **ALUR MONEV MEMBERIKAN FEEDBACK**
```
Monev mengisi Catatan/Alasan 
    ↓
Status TERKUNCI sampai alasan diisi
    ↓
Setelah alasan diisi, monev pilih status:
  - Approved ✓
  - Rejected ✗ 
  - Needs Revision ⟳
    ↓
Monev klik tombol "Stamp Monev" untuk mengunci
    ↓
Status & Alasan terkunci (tidak bisa diubah tanpa researcher revisi dulu)
    ↓
Researcher menerima notifikasi dokumen perlu revisi
```

#### 2. **ALUR RESEARCHER MELAKUKAN REVISI**
```
Researcher melihat dokumen dengan status "Needs Revision"
    ↓
Dokumen TERKUNCI dari monev (tidak bisa diedit sebelum revisi)
    ↓
Researcher membuka form Edit
    ↓
Saat submit, status otomatis:
  - Direset ke "submitted"
  - Terbuka kembali untuk monev evaluasi
  - Monev Notes & Status direset untuk evaluasi baru
  - Revision Count bertambah 1
  - Timestamp resubmit tercatat
    ↓
Researcher Resubmit (Submit Ulang)
    ↓
Monev menerima notifikasi ada dokumen baru untuk evaluasi
```

#### 3. **DOKUMEN APPROVED**
```
Status = Approved
    ↓
Dokumen TERKUNCI dari peneliti (tidak bisa diubah)
    ↓
Hanya bisa dibaca, tidak ada opsi edit
```

---

## 📝 PERUBAHAN DATABASE

### Migration File:
```
database/migrations/2026_01_21_000000_add_monev_feedback_to_documents.php
```

### Kolom Baru di Tabel `documents`:
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `monev_notes` | TEXT | Alasan/catatan dari monev untuk peneliti |
| `monev_status` | ENUM | Status: pending, approved, rejected, needs_revision |
| `monev_stamp_locked` | TIMESTAMP | Waktu ketika status & alasan dikunci |
| `is_locked_for_monev` | BOOLEAN | Flag: dokumen sedang menunggu revisi dari peneliti |
| `researcher_resubmitted_at` | TIMESTAMP | Waktu peneliti melakukan resubmit |
| `revision_count` | INTEGER | Jumlah kali dokumen direvisi |

---

## 🔧 PERUBAHAN CODE

### Backend (Laravel)

#### 1. **Model - `app/Models/Document.php`**
```php
// Tambah fillable fields:
- monev_notes
- monev_status  
- monev_stamp_locked
- is_locked_for_monev
- researcher_resubmitted_at
- revision_count

// Tambah casting:
- monev_stamp_locked => datetime
- researcher_resubmitted_at => datetime
- is_locked_for_monev => boolean
```

#### 2. **Controller - `app/Http/Controllers/DetailController.php`**

**stamp() Method:**
- Validasi: Notes HARUS diisi sebelum stamp bisa diklik
- Validasi: Status HARUS dipilih sebelum stamp
- Auto-lock dokumen saat stamp diklik
- Set timestamp `monev_stamp_locked`

**update() Method - Monev Role:**
- Hanya bisa update `monev_notes` dan `monev_status` (bukan status dokumen)
- Validasi: Jika status dipilih tapi notes kosong → ERROR
- Auto-update main `status` field berdasarkan `monev_status`:
  - `approved` → status = `approved`
  - `rejected` / `needs_revision` → status = `needs_revision`
- Set `is_locked_for_monev = true` untuk rejected/needs_revision
- Tidak auto-stamp (peneliti klik tombol stamp manual)

**update() Method - Researcher/Head Role:**
- Bisa update dokumen jika status ≠ `approved`
- Saat update dokumen yang `is_locked_for_monev = true`:
  - Reset status ke `submitted`
  - Set `is_locked_for_monev = false`
  - Increment `revision_count`
  - Set `researcher_resubmitted_at = now()`
- Monev notes tetap disimpan (untuk referensi)

#### 3. **FormatDocumentData di DetailController**
```php
// Tambah kolom di return array:
'Catatan Monev' => prioritas monev_notes, fallback ke notes
'Status Monev' => monev_status
'Is Locked For Monev' => is_locked_for_monev
'Revision Count' => revision_count
'Researcher Resubmitted At' => researcher_resubmitted_at
```

### Frontend (React/TypeScript)

#### 1. **Component - `resources/js/components/Details/MonevFeedbackModal.tsx`**
- Dialog modal untuk monev memberikan feedback
- Form dengan 2 field:
  - **Alasan/Catatan (Textarea)** - Required, harus diisi duluan
  - **Status (Select)** - Disabled sampai notes diisi
- Validasi client-side
- Fetch ke API endpoint untuk simpan
- Handle error & loading states

#### 2. **UI Component - `resources/js/components/ui/textarea.tsx`** (BARU)
- Reusable Textarea component dengan styling konsisten

#### 3. **Page - `resources/js/pages/details.tsx`**
- Import & render `MonevFeedbackModal`
- State management untuk modal:
  - `monevFeedbackOpen` - toggle modal
  - `selectedMonevDocument` - data dokumen saat ini
  
- Table rendering logic untuk kolom baru:
  - **Status Monev**: 
    - Monev: button "Set Status" (warna berubah sesuai status)
    - Others: read-only display
  - **Catatan Monev**:
    - Monev: clickable button untuk open modal edit
    - Others: read-only display
  
- Update button logic:
  - Hanya tampil untuk researcher/head
  - Disabled jika status = `approved`
  - Enabled jika `is_locked_for_monev = true` (untuk revisi)

---

## 📊 DATA FLOW

### MONEV PERSPECTIVE:
```
1. Lihat tabel dokumen
2. Klik "Set Status" pada kolom "Status Monev"
3. Modal terbuka
4. Isi "Alasan/Catatan" (Required)
5. Pilih status (disabled selama notes kosong)
6. Klik "Simpan Feedback"
7. Data tersimpan, modal tutup, table refresh
8. Klik "Stamp" checkbox untuk lock
9. Validasi: jika notes kosong atau status tidak ada → ERROR
10. Jika valid: stamp, lock dokumen, set timestamp
```

### RESEARCHER PERSPECTIVE:
```
1. Terima notifikasi: dokumen perlu revisi
2. Lihat tabel, dokumen punya status "needs_revision"
3. Baca catatan monev
4. Klik button "Update" di kolom Aksi
5. Form terbuka, edit data sesuai feedback
6. Klik "Submit" untuk resubmit
7. Status otomatis → "submitted" (unlock)
8. Monev melihat ada dokumen baru untuk evaluasi
```

---

## ✅ TESTING CHECKLIST

### Test 1: Monev Feedback Validation
- [ ] Monev klik Status Monev button
- [ ] Modal terbuka dengan field kosong
- [ ] Status dropdown DISABLED (warna abu-abu)
- [ ] Error: "Isi catatan terlebih dahulu" jika klik Submit tanpa notes
- [ ] Isi catatan, status dropdown jadi ENABLED
- [ ] Pilih status, klik Submit
- [ ] Data tersimpan, modal tutup, table refresh

### Test 2: Monev Stamp Locking
- [ ] Klik checkbox "Monev Stamp" TANPA isi notes & status
- [ ] Alert: "Harap isi alasan dan pilih status terlebih dahulu"
- [ ] Isi notes & status, save
- [ ] Klik checkbox stamp
- [ ] Stamp terberi centang ✓
- [ ] Notes & status field LOCKED (gray, disabled)

### Test 3: Researcher Revision Flow
- [ ] Dokumen dengan status "needs_revision" terlihat
- [ ] Kolom aksi menampilkan button "Update"
- [ ] Klik Update, form terbuka (data prefilled)
- [ ] Edit data sesuai feedback monev
- [ ] Submit ulang
- [ ] Status otomatis reset ke "submitted"
- [ ] Revision count increment (0 → 1)
- [ ] Timestamp resubmit tercatat

### Test 4: Approved Document Lock
- [ ] Monev approve dokumen
- [ ] Status Dokumen = "approved"
- [ ] Kolom aksi: tidak ada button "Update"
- [ ] Teks "Disetujui" ditampilkan

### Test 5: Multi-Researcher & Multi-Group
- [ ] Login sebagai Researcher A (Group 1)
- [ ] Lihat hanya dokumen dari Group 1
- [ ] Filter by Group: hanya tampil dokumen Group 1
- [ ] Login sebagai Researcher B (Group 2)
- [ ] Lihat hanya dokumen dari Group 2
- [ ] Login sebagai Monev
- [ ] Lihat semua dokumen dari semua group & researcher
- [ ] Filter by Group: tampil hanya Group dipilih
- [ ] Beri feedback ke dokumen berbeda group
- [ ] Semua flow berjalan normal

### Test 6: Notification (Optional - jika sudah setup)
- [ ] Monev reject dokumen → Researcher terima notifikasi
- [ ] Researcher resubmit → Monev terima notifikasi

---

## 🚀 NEXT STEPS

1. **Run Migration**:
   ```bash
   php artisan migrate
   ```

2. **Test Local**:
   - Buka application di browser
   - Login sebagai monev
   - Test feedback workflow
   - Login sebagai researcher
   - Test revision flow

3. **Setup Notifikasi** (Optional):
   - Buat event & listener untuk resubmit notification
   - Test notifikasi bekerja

4. **Deployment**:
   - Push ke repo
   - Run migration di production
   - Monitor errors di logs

---

## 📝 NOTES

- Kolom `notes` lama tetap dipertahankan untuk backward compatibility
- Jika `monev_notes` kosong, tampilkan fallback ke `notes`
- Semua timestamp dalam UTC
- Revision count tidak bisa di-decrement (hanya increment saat resubmit)
- Approval adalah state final - tidak bisa di-undo tanpa manual database update

---

## 🔗 FILES YANG DIUBAH

### Backend:
- `database/migrations/2026_01_21_000000_add_monev_feedback_to_documents.php` (NEW)
- `app/Models/Document.php` (UPDATED)
- `app/Http/Controllers/DetailController.php` (UPDATED)

### Frontend:
- `resources/js/components/Details/MonevFeedbackModal.tsx` (EXISTING - VERIFIED)
- `resources/js/components/ui/textarea.tsx` (NEW)
- `resources/js/pages/details.tsx` (EXISTING - VERIFIED)

---

**Status**: ✅ Implementation Complete
**Date**: 21 Januari 2026
**Version**: 1.0
