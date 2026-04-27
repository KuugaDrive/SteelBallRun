import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const applyTheme = () => {
    // Always force light theme
    document.documentElement.classList.remove('dark');
};

export function initializeTheme() {
    // Always apply light theme
    applyTheme();
}

export function useAppearance() {
    const [appearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((_appearance?: Appearance) => {
        // Do nothing - theme cannot be changed
        applyTheme();
    }, []);

    useEffect(() => {
        // Always apply light theme
        applyTheme();
    }, []);

    return { appearance, updateAppearance } as const;
}
