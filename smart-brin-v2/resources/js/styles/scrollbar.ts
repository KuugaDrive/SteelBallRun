// Gaya CSS untuk scrollbar transparan
export const transparentScrollbarCSS = `
.transparent-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.transparent-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.transparent-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(155, 155, 155, 0.5);
    border-radius: 20px;
    border: transparent;
}

.transparent-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(155, 155, 155, 0.8);
}
`;

// Style object untuk digunakan dengan React style prop
export const transparentScrollbarStyle = {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
};
