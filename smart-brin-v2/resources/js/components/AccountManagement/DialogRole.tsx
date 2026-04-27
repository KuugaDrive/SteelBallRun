import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User } from '@/components/AccountManagement/UserAccountTable'; 

/**
 * Props untuk komponen DialogRole.
 * @param user - Objek user yang akan diedit, atau null.
 * @param isOpen - Boolean untuk mengontrol visibilitas dialog.
 * @param onClose - Fungsi untuk menutup dialog.
 * @param onRoleSubmit - Fungsi callback yang dipanggil saat form disubmit.
 */
interface DialogRoleProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onRoleSubmit: (userId: string, newRole: string) => void;
}

/**
 * Komponen DialogRole adalah dialog modal untuk mengubah peran (role) seorang user.
 * Ini adalah komponen terkontrol yang state-nya diatur oleh komponen induk.
 */
function DialogRole({ user, isOpen, onClose, onRoleSubmit }: DialogRoleProps) {
    // State internal untuk melacak role yang dipilih di dalam dialog.
    const [selectedRole, setSelectedRole] = useState<string>('');

    // Sinkronkan state internal dengan props saat dialog dibuka untuk user baru.
    useEffect(() => {
        if (user) {
            setSelectedRole(user.role);
        }
    }, [user]);

    // Jangan render dialog jika tidak ada user yang dipilih.
    if (!user) {
        return null;
    }

    // Handler untuk form submission.
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); 
        onRoleSubmit(user.id, selectedRole);
        onClose(); 
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="sm:max-w-[425px]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className='font-bold'>ROLE CHANGE</DialogTitle>
                        <span className='font-semibold'>Nama: {user.name}</span>
                        <DialogDescription>
                            Pilih role baru untuk user ini. Klik simpan jika sudah selesai.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid items-center grid-cols-4 gap-4">
                            <Label htmlFor="role" className="text-right">
                                Role
                            </Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger id="role" className="col-span-3">
                                    <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="head">Head</SelectItem>
                                    <SelectItem value="researcher">Researcher</SelectItem>
                                    <SelectItem value="monev">Monev</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superadmin">Superadmin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className='cursor-pointer bg-white hover:bg-[#E62F2A] hover:text-white'>Batal</Button>
                        </DialogClose>
                        <Button type="submit" className='bg-white hover:bg-[#E62F2A] text-black hover:text-white border cursor-pointer'>Simpan Perubahan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default React.memo(DialogRole);
