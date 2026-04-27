# Admin Role Implementation - Dokumentasi

**Tanggal**: 6 Februari 2026

## 📋 Overview

Implementasi role **ADMIN** terpisah yang berfokus pada **user management** dan **administrative functions** tanpa akses ke fitur dokumen atau evaluasi.

---

## 🔄 Roles Structure (4 Roles)

| Role | Database | Deskripsi | Akses Utama |
|------|----------|-----------|------------|
| **Researcher** | `researcher` | Peneliti | Buat & edit dokumen sendiri |
| **Monev** | `monev` | Tim evaluasi | Review dokumen, berikan feedback |
| **Head** | `head` | Kepala/Director | Penuh akses (dokumen + user management) |
| **Admin** | `admin` | Administrator | User management & administrative tasks |

---

## 📚 Admin Permissions

### ✅ **Yang Bisa Dilakukan Admin**

- ✓ Lihat daftar semua user
- ✓ Ubah role user (researcher ↔ monev ↔ head ↔ admin)
- ✓ Hapus user (kecuali diri sendiri)
- ✓ Hanya akses menu: **Account Management**

### ❌ **Yang TIDAK Bisa Dilakukan Admin**

- ✗ Lihat/edit dokumen (dashboard, details)
- ✗ Memberikan feedback monev (stamp dokumen)
- ✗ Lihat laporan capaian
- ✗ Upload/manage dokumen
- ✗ Akses target tahunan

---

## 🔧 Perubahan Code

### 1. **Database Migration** 
**File**: `database/migrations/2026_02_06_000000_add_admin_role_to_users.php`

```php
Schema::table('users', function (Blueprint $table) {
    $table->enum('role', ['researcher', 'monev', 'head', 'admin'])
        ->default('researcher')
        ->change();
});
```

**Command untuk run**:
```bash
php artisan migrate
```

---

### 2. **Authorization Policy** 
**File**: `app/Policies/DocumentPolicy.php`

**Perubahan**:
- Hanya `manageUsers()` method yang authorize admin
- Admin tidak bisa `view()`, `update()`, `delete()`, `create()` dokumen
- Admin tidak bisa `viewReport()`

```php
// Admin & Head bisa manage users
public function manageUsers(User $user): bool
{
    return in_array($user->role, ['admin', 'head']);
}

// Admin tidak bisa lihat dokumen (hanya 'monev' dan 'head')
public function viewReport(User $user): bool
{
    return in_array($user->role, ['monev', 'head']);
}
```

---

### 3. **User Management Controller**
**File**: `app/Http/Controllers/UserManagementController.php`

**Perubahan**:
- Method `authorizeHeadOnly()` → `authorizeAdminOrHead()`
- Validasi role: tambah `'admin'` ke whitelist

```php
// Sebelum
private function authorizeHeadOnly(): void
{
    $this->authorize('manageUsers', User::class);
}

private function validateRole(Request $request): array
{
    return $request->validate([
        'role' => 'required|in:head,researcher,monev',
    ]);
}

// Sesudah
private function authorizeAdminOrHead(): void
{
    $this->authorize('manageUsers', User::class);
}

private function validateRole(Request $request): array
{
    return $request->validate([
        'role' => 'required|in:head,researcher,monev,admin',
    ]);
}
```

**Methods yang diupdate**:
- `index()` - List user (authorization check)
- `updateRole()` - Change user role
- `destroy()` - Delete user

---

### 4. **Frontend Components**
**File**: `resources/js/components/app-sidebar.tsx`

**Perubahan**:
- Update User interface: tambah `'admin'` ke role union type
- Update navigation menu roles:
  - Admin hanya bisa akses: **Account Management**
  
```tsx
interface User {
    id: number;
    name: string;
    email: string;
    role: 'head' | 'researcher' | 'monev' | 'admin'; // ← TAMBAH ADMIN
}

// Navigation items config
const allNavItems: (NavItem & { roles: string[] })[] = [
    {
        title: 'Account Management',
        href: '/users',
        icon: Users,
        roles: ['head', 'admin'],  // ← TAMBAH ADMIN
    },
    // ... other items tidak include 'admin'
];
```

---

### 5. **Type Definitions**
**Files yang diupdate**:
- `resources/js/pages/details.tsx` - Type User interface
- `resources/js/components/AccountManagement/UserAccountTable.tsx` - Type User interface

```tsx
interface User {
    role: 'head' | 'researcher' | 'monev' | 'admin'; // ← TAMBAH ADMIN
}
```

---

## 📊 Permission Matrix

| Fitur | Researcher | Monev | Head | Admin |
|-------|:----------:|:-----:|:----:|:-----:|
| **Dashboard** | ✓ | ✓ | ✓ | ✗ |
| **Details (View)** | Own Only | All | All | ✗ |
| **Details (Edit)** | Own | Limited | All | ✗ |
| **Details (Delete)** | Own | ✗ | All | ✗ |
| **Monev Feedback** | View | ✓ | ✓ | ✗ |
| **Target Tahunan** | ✗ | ✓ | ✓ | ✗ |
| **Upload Dokumen** | ✓ | ✗ | ✓ | ✗ |
| **Laporan Capaian** | ✗ | ✓ | ✓ | ✗ |
| **Account Management** | ✗ | ✗ | ✓ | ✓ |
| **User Management** | ✗ | ✗ | ✓ | ✓ |

---

## 🚀 Cara Menggunakan Admin Role

### 1. **Cek Admin Role di Database**
```bash
# Login ke MySQL
mysql -u root -p smart_brin

# Check user roles
SELECT id, name, email, role FROM users;
```

### 2. **Assign Admin Role ke User**

**Via UI** (Account Management page):
1. Login sebagai **Head** atau **Admin** yang sudah ada
2. Buka **Account Management** menu
3. Cari user yang ingin dijadikan admin
4. Klik dropdown "Change Role"
5. Pilih **"Admin"**
6. Save

**Via Database**:
```sql
UPDATE users SET role = 'admin' WHERE id = 2;
```

### 3. **Test Admin User**
- Login dengan akun admin
- Pastikan hanya melihat menu **Account Management**
- Coba akses `/dashboard` → Redirect atau akses ditolak

---

## 🔐 Security Considerations

1. **Authorization Check**: Semua route user management diproteksi dengan `authorizeAdminOrHead()`
2. **Policy Authorization**: Model-level authorization via `DocumentPolicy`
3. **Role Validation**: Backend validasi enum role pada saat update
4. **Navigation Filtering**: Frontend filter menu berdasarkan role
5. **No Database Access**: Admin tidak bisa akses data dokumen via frontend

---

## 📝 Notes

- Admin role bersifat **read-only untuk dokumen** (tidak dirender di frontend)
- Admin bisa jadi **escalation path** untuk user management tanpa power kepala proyek
- **Head tetap superior** karena bisa lakukan semua + manage user
- Untuk upgrade admin ke head: gunakan dropdown di Account Management

---

## 🔄 Rollback

Jika perlu revert ke sistem 3 roles:

```bash
# Rollback migration
php artisan migrate:rollback

# Atau manual cleanup:
# UPDATE users SET role = 'researcher' WHERE role = 'admin';
```

---
