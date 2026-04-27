import React from 'react';
import { RadarChart, PolarAngleAxis, PolarGrid, Radar } from 'recharts';
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
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartRadarStatusProps {
    data: { category: string; count: number }[];
    className?: string;
    footerNote?: string;
    dataYear?: number;
}

function ChartRadarStatus({ data = [], className, footerNote, dataYear = 2024 }: ChartRadarStatusProps) {
    const chartData = React.useMemo(() => {
        return data || [];
    }, [data]);

    // Dynamically create chart config based on the data categories
    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            count: {
                label: "Jumlah",
                color: "var(--chart-1)",
            }
        };
        
        // Map specific colors to specific status categories using red and white theme
        const statusColorMap: Record<string, string> = {
            "Submit": "#E62F2A",      // BRIN primary red
            "Accepted": "#B91C1C",    // Dark red
            "Published": "#DC2626",   // Medium red
            "Review": "#EF4444",      // Red
            "Draft": "#F87171",       // Light red
            "Reject": "#991B1B",      // Very dark red
            "Undefined": "#94A3B8",   // Gray color for undefined status
        };
        
        const staticColors = [
            "#E62F2A",  // BRIN primary red
            "#B91C1C",  // Dark red
            "#DC2626",  // Medium red
            "#EF4444",  // Red
            "#F87171",  // Light red
            "#FECACA",  // Very light red
            "#991B1B",  // Very dark red
            "#F04438",  // Red accent
            "#F97066",  // Light red accent
            "#FDA29B",  // Very light red accent
        ];

        // Add each category to the config with appropriate color
        chartData.forEach((item, index) => {
            // Use specific color if defined, otherwise use color from static array
            const color = statusColorMap[item.category] || staticColors[index % staticColors.length];
            
            config[item.category] = {
                label: item.category,
                color: color,
            };
        });
        
        return config;
    }, [chartData]);

    const totalCount = React.useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.count, 0);
    }, [chartData]);

    return (
        <Card className={`shadow-lg rounded-xl ${className}`}>
            <CardHeader className="flex flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                    <CardTitle className="text-lg font-semibold text-[#E62F2A]">Status Publikasi</CardTitle>
                    <CardDescription>Distribusi Status Publikasi - {dataYear}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-center justify-center p-6 pt-0 pb-6">
                {chartData && chartData.length > 0 && chartData.some(item => item.count > 0) ? (
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square w-full"
                        style={{ maxHeight: '320px' }}
                    >
                        <RadarChart data={chartData}>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <PolarAngleAxis 
                                dataKey="category" 
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                axisLineType="circle" 
                            />
                            <PolarGrid gridType="circle" stroke="#e5e7eb" strokeDasharray="3 3" />
                            <Radar
                                dataKey="count"
                                fill="#E62F2A"
                                fillOpacity={0.7}
                                stroke="#B91C1C" 
                                strokeWidth={2}
                                dot={{
                                    r: 4,
                                    fillOpacity: 1,
                                    fill: "#E62F2A",
                                    // stroke: "#FFFFFF",
                                    strokeWidth: 2
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: "#B91C1C",
                                    stroke: "#FFFFFF",
                                    strokeWidth: 2
                                }}
                            />
                        </RadarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 w-full bg-gray-50 rounded-md border border-dashed text-gray-400">
                        <span>No status data available</span>
                        <span className="text-xs mt-2">Check the 'status' column in publication records</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 items-center font-medium leading-none">
                    Total Publikasi: <span className="font-bold">{totalCount.toLocaleString()}</span>
                </div>
                {footerNote && (
                    <div className="text-gray-500 leading-none text-xs mt-1">
                        <span className="font-medium">Keterangan:</span> {footerNote}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

export default ChartRadarStatus;
