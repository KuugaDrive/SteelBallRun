import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role?: 'head' | 'researcher' | 'monev' | 'admin' | 'superadmin';
    tingkat_fungsional?: 'utama' | 'madya' | 'muda' | 'pertama' | null;
    jenis_fungsional?: string | null;
    research_group?: string | null;
    google_scholar_id?: string | null;
    unit_kerja_id?: string | null;
    unit_kerja?: {
        id: string;
        kode_unit: string;
        nama_unit: string;
    } | null;
    kelompok_riset?: {
        id: string;
        unit_kerja_id: string;
        kelompok_riset: string;
    } | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

