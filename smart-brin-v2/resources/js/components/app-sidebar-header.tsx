import { SidebarTrigger } from '@/components/ui/sidebar-trigger';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { toggleSidebar } = useSidebar();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#E62F2A]/50 bg-[#E62F2A] text-white px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-white hover:text-gray-200" onClick={toggleSidebar} />
                <Breadcrumbs breadcrumbs={breadcrumbs} className="text-white" />
            </div>
        </header>
    );
}

export function Breadcrumbs({
    breadcrumbs,
    className,
}: {
    breadcrumbs: BreadcrumbItemType[];
    className?: string; // Tambahkan properti className opsional
}) {
    return (
        <nav className={`flex items-center gap-2 ${className}`}>
            {breadcrumbs.map((breadcrumb, index) => (
                <span key={index} className="text-sm">
                    {breadcrumb.title}
                </span>
            ))}
        </nav>
    );
}