import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";

// Helper function to format numbers as Indonesian Rupiah
const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

export interface BarChartProps {
    title: string;
    data: { name: string | number; count: number; displayName?: string }[];
    className?: string;
    layout?: 'vertical' | 'horizontal';
    tickValues?: number[];
    footerNote?: string;
    dataYear?: number;
}

const BarChart: React.FC<BarChartProps> = ({ 
    title, 
    data, 
    className, 
    layout = 'vertical', 
    tickValues, 
    footerNote,
    dataYear = 2024
}) => {
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        content: string;
        value: number;
    }>({
        visible: false,
        x: 0,
        y: 0,
        content: '',
        value: 0
    });

    const isHorizontal = layout === 'horizontal';
    const maxValue = tickValues && tickValues.length > 0 ? 
        Math.max(...tickValues, ...data.map(d => d.count)) : 
        Math.max(...data.map(d => d.count), 1);
    
    // Dimensions for vertical layout (default)
    let chartHeight = 250;
    let leftMargin = 80;
    let rightMargin = 40;
    let chartWidth = Math.max(700, data.length * 140);
    let barWidth = data.length >= 5 ? 45 : 65;
    let barSpacing = data.length <= 2 ? 200 : 
                    data.length >= 5 ? Math.min(120, (chartWidth - leftMargin - rightMargin) / data.length) :
                    Math.min(140, (chartWidth - leftMargin - rightMargin) / data.length);
    
    // Adjust dimensions for horizontal layout
    if (isHorizontal) {
        chartHeight = Math.max(250, data.length * 60);
        leftMargin = 100;
        rightMargin = 100;
        chartWidth = 700;
        barWidth = data.length >= 5 ? 35 : 45;
        barSpacing = data.length <= 2 ? 80 : 
                    data.length >= 5 ? Math.min(60, (chartHeight - 60) / data.length) :
                    Math.min(70, (chartHeight - 60) / data.length);
    }
    
    // Helper function to safely convert name to string and perform checks
    const safeNameStr = (name: string | number): string => String(name);
    const includesText = (name: string | number, text: string): boolean => safeNameStr(name).toLowerCase().includes(text);
    const equalsText = (name: string | number, text: string): boolean => safeNameStr(name).toLowerCase() === text.toLowerCase();
    const startsWithText = (name: string | number, text: string): boolean => safeNameStr(name).toLowerCase().startsWith(text.toLowerCase());
    
    // Tooltip event handlers with debounce to prevent flickering
    // Use ref to track if mouse is over the bar
    const isMouseOverRef = React.useRef(false);
    
    // Handle mouse enter with a small delay to prevent flickering
    const handleMouseEnter = (e: React.MouseEvent, item: { name: string | number; count: number; displayName?: string }) => {
        isMouseOverRef.current = true;
        const svgRect = (e.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
        if (svgRect) {
            const mouseX = e.clientX - svgRect.left;
            const mouseY = e.clientY - svgRect.top;
            
            // Set tooltip position and content immediately
            setTooltip({
                visible: true,
                x: mouseX,
                y: mouseY,
                content: `${item.displayName || safeNameStr(item.name)}`,
                value: item.count
            });
        }
    };
    
    // Handle mouse move smoothly
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMouseOverRef.current) return;
        
        const svgRect = (e.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
        if (svgRect) {
            const mouseX = e.clientX - svgRect.left;
            const mouseY = e.clientY - svgRect.top;
            
            // Update position without changing visibility state
            setTooltip(prev => ({
                ...prev,
                x: mouseX,
                y: mouseY
            }));
        }
    };
    
    // Handle mouse leave with a small delay to prevent flickering
    const handleMouseLeave = () => {
        isMouseOverRef.current = false;
        
        // Small delay to prevent flickering when moving between bars
        setTimeout(() => {
            if (!isMouseOverRef.current) {
                setTooltip(prev => ({ ...prev, visible: false }));
            }
        }, 50);
    };
    
    return (
        <Card className={`shadow-lg rounded-xl ${className}`}>
            <CardHeader className="flex flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                    <CardTitle className="text-lg font-semibold text-[#E62F2A]">{title}</CardTitle>
                    <CardDescription>Data dari database - {dataYear}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center p-6 pt-0 pb-6">
                <div className="w-full h-96 overflow-auto">
                    {data.length > 0 ? (
                        <div className="w-full h-full">
                            <svg 
                                width="100%" 
                                height="100%" 
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                className={`w-full h-full ${isHorizontal ? 'ml-[-20px]' : ''}`}
                                preserveAspectRatio="xMinYMid meet"
                            >
                                {/* Grid lines */}
                                {(tickValues && tickValues.length > 0 && isHorizontal ? 
                                    tickValues.map((value, i) => ({ value, i })) : 
                                    [0, 1, 2, 3, 4].map((i) => ({ 
                                        value: Math.round(i * maxValue / 4), 
                                        i 
                                    }))
                                ).map(({ value, i }) => {
                                    if (isHorizontal) {
                                        // Horizontal layout - vertical grid lines with custom ticks
                                        const ratio = tickValues && tickValues.length > 0 ? 
                                            value / maxValue : 
                                            i / 4;
                                        const x = leftMargin + (ratio * (chartWidth - leftMargin - rightMargin));
                                        return (
                                            <g key={`grid-${i}`}>
                                                <line 
                                                    x1={x} 
                                                    y1={30} 
                                                    x2={x} 
                                                    y2={chartHeight - 30} 
                                                    stroke="#E2E8F0" 
                                                    strokeWidth="1"
                                                />
                                                <text 
                                                    x={x} 
                                                    y={chartHeight - 10} 
                                                    textAnchor="middle" 
                                                    dominantBaseline="middle" 
                                                    className="text-xs text-gray-500"
                                                >
                                                    {title.toLowerCase().includes('dana') ? formatRupiah(value).slice(0, -3) : value}
                                                </text>
                                            </g>
                                        );
                                    } else {
                                        // Vertical layout - horizontal grid lines
                                        const y = 30 + (i * (chartHeight - 60) / 4);
                                        const value = Math.round((4-i) * maxValue / 4);
                                        return (
                                            <g key={`grid-${i}`}>
                                                <line 
                                                    x1={leftMargin} 
                                                    y1={y} 
                                                    x2={chartWidth} 
                                                    y2={y} 
                                                    stroke="#E2E8F0" 
                                                    strokeWidth="1"
                                                />
                                                <text 
                                                    x={leftMargin - 20} 
                                                    y={y} 
                                                    textAnchor="end" 
                                                    dominantBaseline="middle" 
                                                    className="text-xs text-gray-500"
                                                >
                                                    {title.toLowerCase().includes('dana') ? formatRupiah(value).slice(0, -3) : value}
                                                </text>
                                            </g>
                                        );
                                    }
                                })}
                                
                                {/* Bars */}
                                {data.map((item, index) => {
                                    // Define COLORS array with red and white theme
                                    const COLORS = ['#E62F2A', '#F04438', '#F97066', '#FDA29B', '#FEE4E2', '#FEF3F2'];
                                    const ACCENT_COLORS = ['#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FECACA'];
                                    
                                    // Color the bar based on name with red and white theme
                                    const color = includesText(item.name, 'scopus') && !includesText(item.name, 'non') ? 
                                        '#E62F2A' : (equalsText(item.name, 'non-scopus') ? '#94A3B8' : 
                                        // Q1-Q4 get different shades of red
                                        equalsText(item.name, 'Q1') ? '#E62F2A' :
                                        equalsText(item.name, 'Q2') ? '#F04438' :
                                        equalsText(item.name, 'Q3') ? '#F97066' :
                                        equalsText(item.name, 'Q4') ? '#FDA29B' : 
                                        index % 2 === 0 ? COLORS[index % COLORS.length] : ACCENT_COLORS[index % ACCENT_COLORS.length]);
                                    
                                    if (isHorizontal) {
                                        // Horizontal bar calculation with support for custom tick values
                                        const barLength = (item.count / maxValue) * (chartWidth - leftMargin - rightMargin);
                                        const y = 30 + barWidth/2 + (index * barSpacing);
                                        const x = leftMargin;
                                        
                                        return (
                                            <g key={index}>
                                                {/* Bar */}
                                                <rect
                                                    x={x}
                                                    y={y - barWidth/2}
                                                    width={barLength}
                                                    height={barWidth}
                                                    fill={color}
                                                    rx={4}
                                                    opacity={0.9}
                                                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseLeave={handleMouseLeave}
                                                />
                                                {/* Value at end of bar */}
                                                <text
                                                    x={x + barLength + 8}
                                                    y={y}
                                                    textAnchor="start"
                                                    dominantBaseline="middle"
                                                    className="text-xs font-semibold"
                                                    fill="#334155"
                                                >
                                                    {title.toLowerCase().includes('dana') ? formatRupiah(item.count) : item.count}
                                                </text>
                                                {/* Label to left of bar */}
                                                <text
                                                    x={leftMargin - 8}
                                                    y={y}
                                                    textAnchor="end"
                                                    dominantBaseline="middle"
                                                    className="text-xs font-medium"
                                                    fill="#64748B"
                                                    style={{ fontWeight: 'bold' }}
                                                >
                                                    {item.displayName || safeNameStr(item.name)}
                                                </text>
                                            </g>
                                        );
                                    } else {
                                        // Vertical bar calculation
                                        const barHeight = (item.count / maxValue) * (chartHeight - 60);
                                        const x = leftMargin + 40 + (index * barSpacing);
                                        const y = chartHeight - 30 - barHeight;
                                        
                                        return (
                                            <g key={index}>
                                                {/* Bar */}
                                                <rect
                                                    x={x - barWidth/2}
                                                    y={y}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={color}
                                                    rx={4}
                                                    opacity={0.9}
                                                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseLeave={handleMouseLeave}
                                                />
                                                {/* Value on top of bar */}
                                                <text
                                                    x={x}
                                                    y={y - 5}
                                                    textAnchor="middle"
                                                    className="text-xs font-semibold"
                                                    fill="#334155"
                                                >
                                                    {title.toLowerCase().includes('dana') ? formatRupiah(item.count) : item.count}
                                                </text>
                                                {/* Label under bar */}
                                                <text
                                                    x={x}
                                                    y={chartHeight - 10}
                                                    textAnchor="middle"
                                                    className="text-xs font-medium"
                                                    fill="#64748B"
                                                    style={{ fontWeight: 'bold' }}
                                                >
                                                    {item.displayName || safeNameStr(item.name)}
                                                </text>
                                            </g>
                                        );
                                    }
                                })}
                                
                                {/* Tooltip */}
                                {tooltip.visible && (
                                    <foreignObject 
                                        x={tooltip.x - 80} 
                                        y={tooltip.y - 80} 
                                        width={160} 
                                        height={70}
                                        style={{ overflow: 'visible' }}
                                    >
                                        <div 
                                            className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl"
                                            style={{ 
                                                pointerEvents: 'none',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <div className="grid gap-1.5">
                                                <div className="flex w-full flex-wrap items-center gap-2">
                                                    <div 
                                                        className="shrink-0 rounded-[2px] h-2.5 w-2.5" 
                                                        style={{
                                                            background: "#E62F2A" // Use the BRIN red color
                                                        }}
                                                    />
                                                    <div className="flex flex-1 justify-between leading-none items-center">
                                                        <span className="text-muted-foreground">
                                                            {tooltip.content}
                                                        </span>
                                                        <span className="text-foreground font-mono font-medium tabular-nums ml-2">
                                                            {title.toLowerCase().includes('dana') 
                                                                ? formatRupiah(tooltip.value) 
                                                                : tooltip.value}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </foreignObject>
                                )}
                            </svg>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-neutral-400">No data available</p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start px-6 pb-4 pt-0">
                <div className="text-sm font-medium leading-none mb-1">
                    Total: <span className="font-bold">
                        {title.toLowerCase().includes('dana') 
                            ? formatRupiah(data.reduce((sum, item) => sum + item.count, 0))
                            : data.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                </div>
                {data.length > 0 && data.some(item => includesText(item.name, 'q')) && (
                    <div className="text-gray-500 leading-none">
                        {`${Math.round((data.filter(item => startsWithText(item.name, 'q')).reduce((sum, item) => sum + item.count, 0) / 
                        data.reduce((sum, item) => sum + item.count, 0)) * 100)}% publikasi terindeks Scopus`}
                    </div>
                )}
                {footerNote && (
                    <div className="text-gray-500 leading-none text-xs mt-1">
                        <span className="font-medium">Keterangan:</span> {footerNote}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default BarChart;
export interface ChartPlaceholderProps {
    title: string;
    className?: string;
    dropdown?: boolean;
    dropdownCaption?: string;
    dataYear?: number; // Tambahkan prop dataYear
}

export const BarChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title, className, dataYear = 2024 }) => (
    <Card className={`shadow-lg rounded-xl ${className}`}>
        <CardHeader className="flex flex-row items-start space-y-0 pb-0">
            <div className="grid gap-1">
                <CardTitle className="text-lg font-semibold text-[#E62F2A]">{title}</CardTitle>
                <CardDescription>Data dari database - {dataYear}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center p-6 pt-0 pb-6">
            <div className="flex items-center justify-center h-64 w-full bg-gray-50 rounded-md border border-dashed text-gray-400">
                <span>[Placeholder Bar Chart]</span>
            </div>
        </CardContent>
    </Card>
);
