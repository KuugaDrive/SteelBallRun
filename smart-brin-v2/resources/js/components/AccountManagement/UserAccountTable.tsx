import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// UI Components
import DialogRole from '@/components/AccountManagement/DialogRole';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Icons
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, EllipsisVertical } from 'lucide-react';

// Table Core
import {
    ColumnDef,
    ColumnFiltersState,
    RowSelectionState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

// Toast Notifications
import { toast } from 'sonner';

export type User = {
    id: string;
    name: string;
    email: string;
    research_group?: string | null;
    kelompok_riset?: {
        id: string;
        unit_kerja_id: string;
        kelompok_riset: string;
    } | null;
    google_scholar_id?: string | null;
    unit_kerja_id?: string | null;
    unit_kerja?: {
        id: string;
        kode_unit: string;
        nama_unit: string;
    } | null;
    tingkat_fungsional?: 'utama' | 'madya' | 'muda' | 'pertama' | null;
    jenis_fungsional?: string | null;
    role: 'head' | 'researcher' | 'monev' | 'admin' | 'superadmin';
};

export type UnitKerjaOption = {
    id: string;
    kode_unit: string;
    nama_unit: string;
};

export type KelompokRisetOption = {
    id: string;
    unit_kerja_id: string;
    kelompok_riset: string;
};

interface UserAccountTableProps {
    data: User[];
    unitKerjaOptions: UnitKerjaOption[];
    kelompokRisetOptions: KelompokRisetOption[];
}

export default function UserAccountTable({ data, unitKerjaOptions, kelompokRisetOptions }: UserAccountTableProps) {
    const { props } = usePage<{ errors?: Record<string, string | string[]> }>();
    const lastShownErrorRef = useRef<string>('');

    // State Management
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUnitKerjaId, setSelectedUnitKerjaId] = useState<string>('none');
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        unit_kerja_id: '',
        tingkat_fungsional: '',
        jenis_fungsional: '',
        jenis_fungsional_lainnya: '',
        research_group: '',
        google_scholar_id: '',
    });
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'researcher',
        unit_kerja_id: '',
        tingkat_fungsional: '',
        jenis_fungsional: '',
        jenis_fungsional_lainnya: '',
        research_group: '',
        google_scholar_id: '',
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    useEffect(() => {
        const errorBag = props.errors ?? {};
        const firstErrorValue = Object.values(errorBag)[0];
        const errorMessage = Array.isArray(firstErrorValue) ? firstErrorValue[0] : firstErrorValue;

        if (errorMessage && errorMessage !== lastShownErrorRef.current) {
            lastShownErrorRef.current = errorMessage;
            toast.warning(errorMessage);
            window.alert(`Warning: ${errorMessage}`);
        }
    }, [props.errors]);

    // Handlers
    const handleOpenRoleDialog = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleOpenUnitDialog = (user: User) => {
        setSelectedUser(user);
        setSelectedUnitKerjaId(user.unit_kerja_id ? String(user.unit_kerja_id) : 'none');
        setIsUnitDialogOpen(true);
    };

    const handleOpenEditDialog = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name ?? '',
            email: user.email ?? '',
            password: '',
            password_confirmation: '',
            unit_kerja_id: user.unit_kerja_id ? String(user.unit_kerja_id) : '',
            tingkat_fungsional: user.tingkat_fungsional ?? '',
            jenis_fungsional:
                user.jenis_fungsional === 'perekayasa' || user.jenis_fungsional === 'peneliti' ? user.jenis_fungsional : user.jenis_fungsional ? 'lainnya' : '',
            jenis_fungsional_lainnya:
                user.jenis_fungsional === 'perekayasa' || user.jenis_fungsional === 'peneliti' ? '' : (user.jenis_fungsional ?? ''),
            research_group: user.research_group ?? '',
            google_scholar_id: user.google_scholar_id ?? '',
        });
        setIsEditDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setIsUnitDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedUser(null);
    };

    const handleRoleSubmit = (userId: string, newRole: string) => {
        router.put(
            `/users/${userId}/role`,
            { role: newRole },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Role berhasil diperbarui!'),
            },
        );
    };

    const handleDeleteUser = (user: User) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
            router.delete(`/users/${user.id}`, {
                preserveScroll: true,
                onSuccess: () => toast.success(`User ${user.name} berhasil dihapus.`),
            });
        }
    };

    const handleCreateUser = () => {
        if (createForm.password.length < 8) {
            const message = 'Password harus minimal 8 karakter.';
            toast.warning(message);
            window.alert(`Warning: ${message}`);
            return;
        }

        const jenisFungsionalPayload =
            createForm.jenis_fungsional === ''
                ? null
                : createForm.jenis_fungsional === 'lainnya'
                  ? createForm.jenis_fungsional_lainnya.trim() === ''
                      ? null
                      : createForm.jenis_fungsional_lainnya.trim()
                  : createForm.jenis_fungsional;

        router.post('/users', {
            ...createForm,
            unit_kerja_id: createForm.unit_kerja_id === '' ? null : createForm.unit_kerja_id,
            tingkat_fungsional: createForm.tingkat_fungsional === '' ? null : createForm.tingkat_fungsional,
            jenis_fungsional: jenisFungsionalPayload,
            research_group: createForm.research_group === '' ? null : createForm.research_group,
            google_scholar_id: createForm.google_scholar_id.trim() === '' ? null : createForm.google_scholar_id.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('User berhasil ditambahkan.');
                setIsCreateDialogOpen(false);
                setCreateForm({
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    role: 'researcher',
                    unit_kerja_id: '',
                    tingkat_fungsional: '',
                    jenis_fungsional: '',
                    jenis_fungsional_lainnya: '',
                    research_group: '',
                    google_scholar_id: '',
                });
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                const message = firstError ? String(firstError) : 'Gagal menambahkan user. Periksa kembali formulir.';
                toast.warning(message);
                window.alert(`Warning: ${message}`);
            },
        });
    };

    const handleUnitKerjaSubmit = () => {
        if (!selectedUser) return;

        router.put(
            `/users/${selectedUser.id}/unit-kerja`,
            { unit_kerja_id: selectedUnitKerjaId === 'none' ? null : selectedUnitKerjaId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Unit kerja user berhasil diperbarui!');
                    handleDialogClose();
                },
            },
        );
    };

    const handleUpdateUser = () => {
        if (!selectedUser) return;
        if (editForm.password !== '' && editForm.password.length < 8) {
            const message = 'Password harus minimal 8 karakter.';
            toast.warning(message);
            window.alert(`Warning: ${message}`);
            return;
        }

        const jenisFungsionalPayload =
            editForm.jenis_fungsional === ''
                ? null
                : editForm.jenis_fungsional === 'lainnya'
                  ? editForm.jenis_fungsional_lainnya.trim() === ''
                      ? null
                      : editForm.jenis_fungsional_lainnya.trim()
                  : editForm.jenis_fungsional;

        router.put(
            `/users/${selectedUser.id}`,
            {
                ...editForm,
                unit_kerja_id: editForm.unit_kerja_id === '' ? null : editForm.unit_kerja_id,
                tingkat_fungsional: editForm.tingkat_fungsional === '' ? null : editForm.tingkat_fungsional,
                jenis_fungsional: jenisFungsionalPayload,
                research_group: editForm.research_group === '' ? null : editForm.research_group,
                google_scholar_id: editForm.google_scholar_id.trim() === '' ? null : editForm.google_scholar_id.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Data user berhasil diperbarui!');
                    handleDialogClose();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    const message = firstError ? String(firstError) : 'Gagal memperbarui data. Periksa kembali formulir.';
                    toast.warning(message);
                    window.alert(`Warning: ${message}`);
                },
            },
        );
    };

    // Table Columns Definition
    const columns: ColumnDef<User>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Nama User' },
        { accessorKey: 'email', header: 'Email' },
        {
            id: 'research_group',
            header: 'Research Group',
            cell: ({ row }) => row.original.kelompok_riset?.kelompok_riset || '-',
        },
        {
            id: 'google_scholar_id',
            header: 'Google Scholar ID',
            cell: ({ row }) => row.original.google_scholar_id || '-',
        },
        {
            id: 'unit_kerja',
            header: 'Unit Kerja',
            cell: ({ row }) => {
                const unit = row.original.unit_kerja;
                return unit ? `${unit.nama_unit} (${unit.kode_unit})` : '-';
            },
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const role = row.getValue('role') as User['role'];
                let roleClass = 'border-transparent';

                switch (role) {
                    case 'head':
                        roleClass += ' bg-red-100 text-red-700';
                        break;
                    case 'researcher':
                        roleClass += ' bg-gray-100 text-gray-800';
                        break;
                    case 'monev':
                        roleClass += ' bg-indigo-100 text-indigo-700';
                        break;
                    case 'superadmin':
                        roleClass += ' bg-amber-100 text-amber-800';
                        break;
                    default:
                        roleClass += ' bg-gray-100 text-gray-800';
                }

                return <Badge className={roleClass}>{role}</Badge>;
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Aksi</div>,
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-8 h-8 p-0">
                                    <span className="sr-only">Buka menu</span>
                                    <EllipsisVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>Ubah Data User</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenUnitDialog(user)}>Ubah Unit Kerja</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>Ubah Role</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user)}>
                                    Hapus User
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            enableHiding: false,
        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnFilters, rowSelection, columnVisibility },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const availableEditKelompokRiset = editForm.unit_kerja_id
        ? kelompokRisetOptions.filter((item) => item.unit_kerja_id === editForm.unit_kerja_id)
        : kelompokRisetOptions;

    const availableCreateKelompokRiset = createForm.unit_kerja_id
        ? kelompokRisetOptions.filter((item) => item.unit_kerja_id === createForm.unit_kerja_id)
        : kelompokRisetOptions;

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 py-4">
                <Input
                    placeholder="Cari berdasarkan nama..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="ml-auto cursor-pointer bg-white text-black hover:bg-[#E62F2A] hover:text-white data-[state=open]:bg-[#E62F2A] data-[state=open]:text-white"
                        >
                            Filters <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {column.id === 'name' ? 'Nama User' : column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    className="bg-[#E62F2A] text-white hover:bg-[#c42723]"
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    Tambah User
                </Button>
            </div>

            <div className="min-h-[500px] overflow-x-auto rounded-md border">
                <Table className="min-w-full">
                    <TableHeader className="bg-[#E62F2A]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-white">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Tidak ada data ditemukan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex-1 text-sm font-semibold">
                    <div className="md:hidden">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="hidden md:block">
                        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-6 lg:space-x-8">
                    <div className="items-center hidden space-x-2 md:flex">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="hidden w-[100px] items-center justify-center text-sm font-medium md:flex">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden w-8 h-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" className="w-8 h-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" className="w-8 h-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden w-8 h-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <DialogRole user={selectedUser} isOpen={isDialogOpen} onClose={handleDialogClose} onRoleSubmit={handleRoleSubmit} />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Ubah Data User</DialogTitle>
                        <DialogDescription>Perbarui data user sesuai perubahan struktur database.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nama</Label>
                            <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Unit Kerja</Label>
                            <Select
                                value={editForm.unit_kerja_id || 'none'}
                                onValueChange={(value) =>
                                    setEditForm((s) => ({ ...s, unit_kerja_id: value === 'none' ? '' : value, research_group: '' }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opsional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {unitKerjaOptions.map((unit) => (
                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                            {unit.nama_unit} ({unit.kode_unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Tingkat Fungsional</Label>
                                <Select
                                    value={editForm.tingkat_fungsional || 'none'}
                                    onValueChange={(value) => setEditForm((s) => ({ ...s, tingkat_fungsional: value === 'none' ? '' : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Opsional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-</SelectItem>
                                        <SelectItem value="utama">Utama</SelectItem>
                                        <SelectItem value="madya">Madya</SelectItem>
                                        <SelectItem value="muda">Muda</SelectItem>
                                        <SelectItem value="pertama">Pertama</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Jenis Fungsional</Label>
                                <Select
                                    value={editForm.jenis_fungsional || 'none'}
                                    onValueChange={(value) =>
                                        setEditForm((s) => ({
                                            ...s,
                                            jenis_fungsional: value === 'none' ? '' : value,
                                            jenis_fungsional_lainnya: value === 'lainnya' ? s.jenis_fungsional_lainnya : '',
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Opsional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-</SelectItem>
                                        <SelectItem value="perekayasa">Perekayasa</SelectItem>
                                        <SelectItem value="peneliti">Peneliti</SelectItem>
                                        <SelectItem value="lainnya">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {editForm.jenis_fungsional === 'lainnya' && (
                            <div className="grid gap-2">
                                <Label htmlFor="edit-jenis-fungsional-lainnya">Jenis Fungsional Lainnya</Label>
                                <Input
                                    id="edit-jenis-fungsional-lainnya"
                                    value={editForm.jenis_fungsional_lainnya}
                                    onChange={(e) => setEditForm((s) => ({ ...s, jenis_fungsional_lainnya: e.target.value }))}
                                    placeholder="Isi jenis fungsional"
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Research Group</Label>
                            <Select
                                value={editForm.research_group || 'none'}
                                onValueChange={(value) => setEditForm((s) => ({ ...s, research_group: value === 'none' ? '' : value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opsional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {availableEditKelompokRiset.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.kelompok_riset}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-google-scholar-id">Google Scholar ID</Label>
                            <Input
                                id="edit-google-scholar-id"
                                value={editForm.google_scholar_id}
                                onChange={(e) => setEditForm((s) => ({ ...s, google_scholar_id: e.target.value }))}
                                placeholder="Opsional"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">Password Baru</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    minLength={8}
                                    value={editForm.password}
                                    onChange={(e) => setEditForm((s) => ({ ...s, password: e.target.value }))}
                                    placeholder="Kosongkan jika tidak diubah"
                                />
                                <p className="text-xs text-amber-700">Jika diisi, password minimal 8 karakter.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password-confirmation">Konfirmasi Password</Label>
                                <Input
                                    id="edit-password-confirmation"
                                    type="password"
                                    value={editForm.password_confirmation}
                                    onChange={(e) => setEditForm((s) => ({ ...s, password_confirmation: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            Batal
                        </Button>
                        <Button className="bg-[#E62F2A] text-white hover:bg-[#c42723]" onClick={handleUpdateUser}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Ubah Unit Kerja User</DialogTitle>
                        <DialogDescription>Pilih unit kerja untuk user yang dipilih.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 py-2">
                        <Label>Unit Kerja</Label>
                        <Select value={selectedUnitKerjaId} onValueChange={setSelectedUnitKerjaId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih unit kerja" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-</SelectItem>
                                {unitKerjaOptions.map((unit) => (
                                    <SelectItem key={unit.id} value={String(unit.id)}>
                                        {unit.nama_unit} ({unit.kode_unit})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            Batal
                        </Button>
                        <Button className="bg-[#E62F2A] text-white hover:bg-[#c42723]" onClick={handleUnitKerjaSubmit}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tambah User</DialogTitle>
                        <DialogDescription>Hanya admin dan superadmin yang dapat menambahkan user baru.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="new-name">Nama</Label>
                            <Input id="new-name" value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-email">Email</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={createForm.email}
                                onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new-google-scholar-id">Google Scholar ID</Label>
                            <Input
                                id="new-google-scholar-id"
                                value={createForm.google_scholar_id}
                                onChange={(e) => setCreateForm((s) => ({ ...s, google_scholar_id: e.target.value }))}
                                placeholder="Opsional"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    minLength={8}
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
                                />
                                <p className="text-xs text-amber-700">Password minimal 8 karakter.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password-confirmation">Konfirmasi Password</Label>
                                <Input
                                    id="new-password-confirmation"
                                    type="password"
                                    value={createForm.password_confirmation}
                                    onChange={(e) => setCreateForm((s) => ({ ...s, password_confirmation: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select value={createForm.role} onValueChange={(value) => setCreateForm((s) => ({ ...s, role: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="researcher">Researcher</SelectItem>
                                        <SelectItem value="head">Head</SelectItem>
                                        <SelectItem value="monev">Monev</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="superadmin">Superadmin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Tingkat Fungsional</Label>
                                <Select
                                    value={createForm.tingkat_fungsional || 'none'}
                                    onValueChange={(value) => setCreateForm((s) => ({ ...s, tingkat_fungsional: value === 'none' ? '' : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Opsional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-</SelectItem>
                                        <SelectItem value="utama">Utama</SelectItem>
                                        <SelectItem value="madya">Madya</SelectItem>
                                        <SelectItem value="muda">Muda</SelectItem>
                                        <SelectItem value="pertama">Pertama</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Jenis Fungsional</Label>
                            <Select
                                value={createForm.jenis_fungsional || 'none'}
                                onValueChange={(value) =>
                                    setCreateForm((s) => ({
                                        ...s,
                                        jenis_fungsional: value === 'none' ? '' : value,
                                        jenis_fungsional_lainnya: value === 'lainnya' ? s.jenis_fungsional_lainnya : '',
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opsional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    <SelectItem value="perekayasa">Perekayasa</SelectItem>
                                    <SelectItem value="peneliti">Peneliti</SelectItem>
                                    <SelectItem value="lainnya">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {createForm.jenis_fungsional === 'lainnya' && (
                            <div className="grid gap-2">
                                <Label htmlFor="new-jenis-fungsional-lainnya">Jenis Fungsional Lainnya</Label>
                                <Input
                                    id="new-jenis-fungsional-lainnya"
                                    value={createForm.jenis_fungsional_lainnya}
                                    onChange={(e) => setCreateForm((s) => ({ ...s, jenis_fungsional_lainnya: e.target.value }))}
                                    placeholder="Isi jenis fungsional"
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Unit Kerja</Label>
                            <Select
                                value={createForm.unit_kerja_id || 'none'}
                                onValueChange={(value) =>
                                    setCreateForm((s) => ({ ...s, unit_kerja_id: value === 'none' ? '' : value, research_group: '' }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opsional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {unitKerjaOptions.map((unit) => (
                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                            {unit.nama_unit} ({unit.kode_unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Research Group</Label>
                            <Select
                                value={createForm.research_group || 'none'}
                                onValueChange={(value) => setCreateForm((s) => ({ ...s, research_group: value === 'none' ? '' : value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opsional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {availableCreateKelompokRiset.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.kelompok_riset}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button className="bg-[#E62F2A] text-white hover:bg-[#c42723]" onClick={handleCreateUser}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

