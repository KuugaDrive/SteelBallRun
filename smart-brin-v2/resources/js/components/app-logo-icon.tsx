import React from 'react';

export default function AppLogoIcon(props: React.HTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/assets/Logo-BRIN.png" // Path ke logo di folder public
            alt="BRIN Logo"
            className="w-full h-auto" // Menyesuaikan ukuran logo
        />
    );
}
