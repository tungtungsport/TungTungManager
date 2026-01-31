"use client";

import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface DailySale {
    day: number;
    sales: number;
}

export default function SalesAnalysisPage() {
    const [dailySales, setDailySales] = useState<DailySale[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Date filter
    const {
        filterPeriod, setFilterPeriod,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedDate, setSelectedDate,
        getDateRange
    } = useDateFilter('daily');

    useEffect(() => {
        async function fetchSalesData() {
            try {
                setIsLoading(true);
                const { startDate, endDate } = getDateRange;

                // Fetch all orders from filtered date range
                let query = supabase
                    .from('orders')
                    .select('total, created_at')
                    .eq('status', 'SELESAI');

                if (startDate && endDate) {
                    query = query.gte('created_at', startDate).lte('created_at', endDate);
                } else {
                    // Default to last 30 days if no filter
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    query = query.gte('created_at', thirtyDaysAgo.toISOString());
                }

                const { data: ordersData, error } = await query;

                if (error) {
                    console.error('Error fetching orders:', error);
                    setIsLoading(false);
                    return;
                }

                // Group by day
                const salesByDay: Record<number, number> = {};
                let total = 0;

                (ordersData || []).forEach(order => {
                    const orderDate = new Date(order.created_at);
                    const daysAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                    const dayNum = 30 - daysAgo;
                    if (dayNum > 0 && dayNum <= 30) {
                        salesByDay[dayNum] = (salesByDay[dayNum] || 0) + order.total;
                        total += order.total;
                    }
                });

                // Create array for chart
                const chartData: DailySale[] = [];
                for (let i = 1; i <= 30; i++) {
                    chartData.push({ day: i, sales: salesByDay[i] || 0 });
                }

                setDailySales(chartData);
                setTotalRevenue(total);
                setTotalOrders(ordersData?.length || 0);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSalesData();
    }, [getDateRange]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    const avgDailySales = dailySales.length > 0 ? Math.round(totalRevenue / 30) : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Analisis Penjualan</h1>
                    <p className="text-[#C7D4CE] text-sm mt-1">Wawasan detail pendapatan dan perilaku penjualan</p>
                </div>
                <DateFilter
                    filterPeriod={filterPeriod}
                    setFilterPeriod={setFilterPeriod}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <p className="text-[#C7D4CE] text-xs uppercase tracking-wider mb-2">Total Pendapatan</p>
                    <p className="font-numeric text-2xl text-[#7CFF9B] font-bold">Rp {(totalRevenue / 1000000).toFixed(1)}M</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <p className="text-[#C7D4CE] text-xs uppercase tracking-wider mb-2">Rata-rata Harian</p>
                    <p className="font-numeric text-2xl text-white font-bold">Rp {(avgDailySales / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <p className="text-[#C7D4CE] text-xs uppercase tracking-wider mb-2">Total Pesanan</p>
                    <p className="font-numeric text-2xl text-[#1ED760] font-bold">{totalOrders}</p>
                </div>
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-[#7CFF9B]" />
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider">Penjualan Harian (30 Hari Terakhir)</h3>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailySales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" />
                            <XAxis dataKey="day" stroke="#C7D4CE" fontSize={12} />
                            <YAxis
                                stroke="#C7D4CE"
                                fontSize={12}
                                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                formatter={(value: any) => [`Rp ${(Number(value) / 1000000).toFixed(2)}M`, 'Penjualan']}
                                labelFormatter={(label) => `Day ${label}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="#7CFF9B"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: '#1ED760' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
