// resources/js/components/ui/sidebar-trigger.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useSidebar } from './sidebar'; // Impor useSidebar dari sidebar utama

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
    // Get state and toggle function from the sidebar context
    const { state, toggleSidebar } = useSidebar();

    // Handle click event to toggle sidebar state
    const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
        // Use the toggleSidebar function from context which handles both mobile and desktop states
        toggleSidebar();
        
        // Call the onClick handler from parent if provided
        if (onClick) {
            onClick(event);
        }
    };

    // Tentukan ikon berdasarkan state sidebar
    const IconComponent = state === 'expanded' ? ChevronLeft : ChevronRight;

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${className}`}
            onClick={handleToggle}
            {...props}
        >
            <IconComponent />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    );
}