import { CSSProperties } from 'react';

// Reusable transparent scrollbar styles
export const transparentScrollbarCSS = `
    .transparent-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    .transparent-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .transparent-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 20px;
        border: 2px solid transparent;
    }

    .transparent-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.5);
    }
`;

// Firefox and standard browser scrollbar styles as a plain object
// Using a separate object without strict typing to avoid TypeScript issues
export const transparentScrollbarStyle = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
} as CSSProperties;
