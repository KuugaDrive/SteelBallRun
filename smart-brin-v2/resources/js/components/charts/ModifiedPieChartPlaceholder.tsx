import React from 'react';
import { PieChart, Pie, Cell, Sector, Label } from 'recharts';
import { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Updated to handle both data formats - either with jenis or name property
export interface ModifiedPieChartPlaceholderProps {
    title: string;
    className?: string;
    data: { jenis: string; count: number; name?: string; }[];
    footerNote?: string; // Tambahkan prop footerNote
    dataYear?: number; // Tahun data yang ditampilkan
}

const ModifiedPieChartPlaceholder = ({ title, className, data = [], footerNote, dataYear = 2024 }: ModifiedPieChartPlaceholderProps) => {
    // Transform data for Recharts, mirip desktopData dari contoh Shadcn
    const chartData = React.useMemo(() => {
        // Use actual data from backend, only fallback to mock data if necessary
        const baseData = data.length > 0 ? data : [];

        return baseData.map((item) => {
            // Use jenis if available, otherwise use name
            const categoryName = item.jenis || item.name || 'Unknown';
            return {
                name: categoryName,
                value: item.count,
                // `fill` akan diambil dari variabel CSS `--color-categoryname`
                // yang diatur oleh ChartStyle Shadcn
                fill: `var(--color-${categoryName.toLowerCase().replace(/ /g, '-')})`
            };
        });
    }, [data]);
    
    const id = "pie-interactive-modified"; // ID unik untuk ChartContainer dan ChartStyle
    
    // chartConfig harus sesuai dengan ChartConfig dari Shadcn UI
    // dan mencerminkan kategori data yang sebenarnya (jurnal, prosiding, dll.)
    const chartConfig: ChartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            // Definisikan juga 'Total' jika digunakan di Label tengah
            total: {
                label: "Total",
                color: "hsl(var(--foreground))", // Warna default atau sesuaikan
            }
        };

        // Definisikan warna spesifik untuk setiap kategori dengan tema merah dan putih
        // Menggunakan variasi merah untuk tema BRIN
        const staticColors = [
            "#E62F2A", // Merah BRIN primary
            "#B91C1C", // Merah tua
            "#DC2626", // Merah medium
            "#EF4444", // Merah
            "#F87171", // Merah muda
            "#FECACA", // Merah sangat muda
            "#991B1B", // Merah sangat tua
            "#F04438", // Merah accent
            "#F97066", // Merah muda accent
            "#FDA29B", // Merah sangat muda accent
        ];

        chartData.forEach((item, index) => {
            const categoryKey = item.name.toLowerCase().replace(/ /g, '-');
            config[categoryKey] = {
                label: item.name,
                color: staticColors[index % staticColors.length] || "hsl(var(--primary))",
            };
        });
        
        return config;
    }, [chartData]);
    
    // State untuk kategori yang aktif, sama seperti di ChartPieInteractive Shadcn
    const [activeCategory, setActiveCategory] = React.useState(chartData && chartData.length > 0 ? chartData[0].name : '');
    
    const activeIndex = React.useMemo(
        () => chartData.findIndex((item) => item.name === activeCategory),
        [activeCategory, chartData]
    );

    const categories = React.useMemo(() => chartData.map((item) => item.name), [chartData]);

    // Active shape render function, persis seperti ChartPieInteractive Shadcn
    const renderActiveShape = ({
        outerRadius = 0,
        ...props
    }: PieSectorDataItem) => (
        <g>
            <Sector {...props} outerRadius={outerRadius + 10} />
            <Sector
                {...props}
                outerRadius={outerRadius + 25}
                innerRadius={outerRadius + 12}
            />
        </g>
    );
    
    return (
        <Card data-chart={id} className={`flex flex-col shadow-lg rounded-xl ${className}`}>
            <ChartStyle id={id} config={chartConfig} /> {/* Menggunakan ChartStyle dari Shadcn */}
            
            <CardHeader className="flex flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                    <CardTitle className="text-lg font-semibold text-[#E62F2A]">{title}</CardTitle>
                    <CardDescription>Januari - Desember {dataYear}</CardDescription>
                </div>
                {/* Menggunakan Shadcn Select components */}
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                    <SelectTrigger
                        className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl">
                        {categories.map((key) => {
                            const configItem = chartConfig[key.toLowerCase().replace(/ /g, '-') as keyof typeof chartConfig];

                            if (!configItem) {
                                return null;
                            }

                            return (
                                <SelectItem
                                    key={key}
                                    value={key}
                                    className="rounded-lg [&_span]:flex"
                                >
                                    <div className="flex items-center gap-2 text-xs">
                                        <span
                                            className="flex h-3 w-3 shrink-0 rounded-xs"
                                            style={{
                                                backgroundColor: `var(--color-${key.toLowerCase().replace(/ /g, '-')})`,
                                            }}
                                        />
                                        {configItem?.label}
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </CardHeader>
            
            <CardContent className="flex flex-1 flex-col items-center justify-center p-6 pt-0 pb-6">
                {/* Hapus ResponsiveContainer dari sini */}
                <ChartContainer 
                    id={id} 
                    config={chartConfig} 
                    className="mx-auto" 
                    style={{ height: '300px', width: '300px' }} // Atur tinggi dan lebar tetap
                >
                    {chartData && chartData.length > 0 ? (
                        <PieChart width={300} height={300}> {/* DIMENSI LANGSUNG KE PIECHART */}
                                {/* Menggunakan ChartTooltip Shadcn */}
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    strokeWidth={5}
                                    activeShape={renderActiveShape}
                                    onMouseEnter={(_, index) => {
                                        if (chartData[index]) {
                                            setActiveCategory(chartData[index].name);
                                        }
                                    }}
                                    isAnimationActive={true}
                                >
                                    {/* Define cells with red and white theme colors */}
                                    {chartData.map((entry, index) => {
                                        // Red and white theme color palette
                                        const redColors = [
                                            "#E62F2A", // Merah BRIN primary
                                            "#B91C1C", // Merah tua
                                            "#DC2626", // Merah medium
                                            "#EF4444", // Merah
                                            "#F87171", // Merah muda
                                            "#FECACA", // Merah sangat muda
                                            "#991B1B", // Merah sangat tua
                                            "#F04438", // Merah accent
                                            "#F97066", // Merah muda accent
                                            "#FDA29B", // Merah sangat muda accent
                                        ];
                                        return <Cell key={`cell-${index}`} fill={redColors[index % redColors.length]} />;
                                    })}
                                    <Label
                                        content={({ viewBox }) => {
                                            // Handle viewBox for different chart types (CartesianViewBox or PolarViewBox)
                                            // Use type assertion to access cx and cy for PolarViewBox type
                                            const polarViewBox = viewBox as { cx?: number; cy?: number } | undefined;
                                            const cx = polarViewBox?.cx ?? 150; // Fallback if undefined (width/2)
                                            const cy = polarViewBox?.cy ?? 150; // Fallback if undefined (height/2)


                                            const currentItem = activeIndex >= 0 ? chartData[activeIndex] : null; // Gunakan activeIndex

                                            return (
                                                <text
                                                    x={cx}
                                                    y={cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={cx}
                                                        y={cy}
                                                        className="fill-foreground text-3xl font-bold"
                                                    >
                                                        {currentItem ? currentItem.value.toLocaleString() : '0'}
                                                    </tspan>
                                                    <tspan  
                                                        x={cx}
                                                        y={(cy || 0) + 24}
                                                        className="fill-muted-foreground"
                                                    >
                                                        {currentItem ? currentItem.name : 'N/A'} {/* PERBAIKAN DI SINI */}
                                                    </tspan>
                                                </text>
                                            );
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded-md border border-dashed text-gray-400">
                            <span>No data available</span>
                        </div>
                    )}
                </ChartContainer>
                
                {/* Legend horizontal di bawah pie chart - Non-interactive */}
                {chartData && chartData.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 mt-4 px-4">
                        {chartData.map((entry, index) => {
                            const configItem = chartConfig[entry.name.toLowerCase().replace(/ /g, '-') as keyof typeof chartConfig];
                            
                            // Define red color palette for legend
                            const legendRedColors = [
                                "#E62F2A", // Merah BRIN primary
                                "#B91C1C", // Merah tua
                                "#DC2626", // Merah medium
                                "#EF4444", // Merah
                                "#F87171", // Merah muda
                                "#FECACA", // Merah sangat muda
                                "#991B1B", // Merah sangat tua
                                "#F04438", // Merah accent
                                "#F97066", // Merah muda accent
                                "#FDA29B", // Merah sangat muda accent
                            ];
                            
                            return (
                                <div
                                    key={`legend-${index}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: legendRedColors[index % legendRedColors.length],
                                        }}
                                    />
                                    <span className="font-medium text-gray-700">
                                        {configItem?.label || entry.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        ({entry.value.toLocaleString()})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* Footer untuk total dan keterangan tambahan */}
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 items-center font-medium leading-none">
                    Total: <span className="font-bold">{chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</span>
                </div>
                {footerNote && (
                    <div className="text-gray-500 leading-none text-xs mt-1">
                        <span className="font-medium">Keterangan:</span> {footerNote}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default ModifiedPieChartPlaceholder;
