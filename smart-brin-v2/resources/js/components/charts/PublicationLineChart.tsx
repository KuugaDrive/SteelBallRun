import React, { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface LineChartProps {
    title: string;
    data: { name: string; total: number }[];
    className?: string;
    dropdown?: boolean;
    dataYear?: number; // Tahun data yang ditampilkan
}

const PublicationLineChart: React.FC<LineChartProps> = ({ 
    title, 
    data, 
    className, 
    dropdown = false,
    dataYear = 2024
}) => {
    const [selectedYear, setSelectedYear] = useState<string>(dataYear.toString());
    
    // Transform data for Recharts
    const chartData = data.map(item => ({
        month: item.name,
        publications: item.total,
    }));
    
    // Calculate trend percentage
    const currentTotal = data.reduce((sum, item) => sum + item.total, 0);
    const trendPercentage = data.length > 1 ? 
        ((data[data.length - 1].total - data[0].total) / data[0].total * 100).toFixed(1) : 0;
    
    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-[#E62F2A]">{title}</CardTitle>
                        <CardDescription>January - December 2024</CardDescription>
                    </div>
                    {dropdown && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="border rounded px-3 py-2 text-sm bg-white flex items-center gap-2 hover:bg-gray-50">
                                    {selectedYear} <ChevronDown size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent >
                                <DropdownMenuItem onClick={() => setSelectedYear('2024')}>2024</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedYear('2023')}>2023</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedYear('2022')}>2022</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full h-64">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="month" 
                                    stroke="#6b7280"
                                    fontSize={11}
                                    tickFormatter={(value) => value.substring(0, 3)}
                                />
                                <YAxis 
                                    stroke="#6b7280"
                                    fontSize={11}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                    <p className="font-medium text-gray-700">{label}</p>
                                                    <p className="text-[#E62F2A]">
                                                        Publikasi: {payload[0].value}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="publications"
                                    stroke="#E62F2A"
                                    strokeWidth={3}
                                    dot={{ 
                                        fill: "#E62F2A", 
                                        strokeWidth: 2, 
                                        r: 4 
                                    }}
                                    activeDot={{ 
                                        r: 6, 
                                        fill: "#E62F2A",
                                        stroke: "#fff",
                                        strokeWidth: 2
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded-md border border-dashed text-gray-400">
                            <span>No data available</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 items-center font-medium leading-none">
                    {Number(trendPercentage) > 0 ? (
                        <>
                            Trending up by {trendPercentage}% this year 
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </>
                    ) : Number(trendPercentage) < 0 ? (
                        <>
                            Trending down by {Math.abs(Number(trendPercentage))}% this year
                            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                        </>
                    ) : (
                        <>
                            No change this year
                            <div className="h-4 w-4" />
                        </>
                    )}
                </div>
                <div className="text-gray-500 leading-none">
                    Showing total publications for the last 12 months ({currentTotal} total)
                </div>
            </CardFooter>
        </Card>
    );
};

export default PublicationLineChart;
