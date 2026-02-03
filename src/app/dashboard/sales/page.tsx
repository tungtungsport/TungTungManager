"use client";

import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface DailySale {
    day: string;
    sales: number;
}

const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
};

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
    } = useDateFilter('weekly');

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

                let effectiveStartDate: Date;
                let effectiveEndDate: Date;

                if (startDate && endDate) {
                    query = query.gte('created_at', startDate).lte('created_at', endDate);
                    effectiveStartDate = new Date(startDate);
                    effectiveEndDate = new Date(endDate);
                } else {
                    // Default to last 30 days if no filter
                    effectiveEndDate = new Date();
                    effectiveStartDate = new Date();
                    effectiveStartDate.setDate(effectiveStartDate.getDate() - 30);
                    query = query.gte('created_at', effectiveStartDate.toISOString());
                }

                const { data: ordersData, error } = await query;

                if (error) {
                    console.error('Error fetching orders:', error);
                    setIsLoading(false);
                    return;
                }

                // Helper to get local date key (YYYY-MM-DD) safely
                const getLocalISO = (date: Date) => {
                    const offset = date.getTimezoneOffset();
                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                    return localDate.toISOString().split('T')[0];
                };

                // Group Data Logic
                const chartData: DailySale[] = [];
                let total = 0;

                if (filterPeriod === 'yearly') {
                    // Group by Month for Yearly view (Last 12 months)
                    const salesByMonth: Record<string, number> = {};
                    (ordersData || []).forEach(order => {
                        const d = new Date(order.created_at);
                        const key = getLocalISO(d).slice(0, 7); // YYYY-MM
                        salesByMonth[key] = (salesByMonth[key] || 0) + order.total;
                        total += order.total;
                    });

                    // Generate last 12 months
                    for (let i = 0; i < 12; i++) {
                        const d = new Date(effectiveStartDate);
                        d.setMonth(d.getMonth() + i);
                        const key = getLocalISO(d).slice(0, 7); // YYYY-MM

                        // Format: "Jan 2025"
                        const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                        chartData.push({ day: label, sales: salesByMonth[key] || 0 });
                    }
                } else {
                    // Daily Logic for other filters
                    let numDays: number;

                    if (filterPeriod === 'monthly') {
                        // For "Bulan Ini", show last 30 days from today
                        numDays = 30;
                        effectiveStartDate = new Date(effectiveEndDate);
                        effectiveStartDate.setDate(effectiveEndDate.getDate() - 29); // 30 days including today
                    } else {
                        // Calculate days between dates (inclusive of start, exclusive of end + 1 day)
                        const daysDiff = Math.round((effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24));
                        numDays = Math.min(Math.max(daysDiff, 1), 31); // Min 1, Max 31 days
                    }

                    // Group by actual date
                    const salesByDate: Record<string, number> = {};

                    (ordersData || []).forEach(order => {
                        const orderDate = new Date(order.created_at);
                        const dateKey = getLocalISO(orderDate); // YYYY-MM-DD
                        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.total;
                        total += order.total;
                    });

                    // Create array for chart with actual dates
                    for (let i = 0; i < numDays; i++) {
                        // Use millisecond arithmetic for reliable date increment
                        const dateMs = effectiveStartDate.getTime() + (i * 24 * 60 * 60 * 1000);
                        const date = new Date(dateMs);
                        const dateKey = getLocalISO(date); // YYYY-MM-DD
                        const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`;
                        chartData.push({ day: dayLabel, sales: salesByDate[dateKey] || 0 });
                    }
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
    }, [getDateRange, filterPeriod]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    const avgDailySales = dailySales.length > 0 ? Math.round(totalRevenue / dailySales.length) : 0;

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
                    <p className="font-numeric text-2xl text-[#7CFF9B] font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <p className="text-[#C7D4CE] text-xs uppercase tracking-wider mb-2">
                        {filterPeriod === 'yearly' ? 'Rata-rata Bulanan' : 'Rata-rata Harian'}
                    </p>
                    <p className="font-numeric text-2xl text-white font-bold">{formatCurrency(avgDailySales)}</p>
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
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider">
                        {filterPeriod === 'yearly'
                            ? `Penjualan Bulanan (${dailySales.length} Bulan)`
                            : `Penjualan Harian (${dailySales.length} Hari)`}
                    </h3>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailySales}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" />
                            <XAxis dataKey="day" stroke="#C7D4CE" fontSize={12} />
                            <YAxis
                                stroke="#C7D4CE"
                                fontSize={12}
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                formatter={(value: any) => [formatCurrency(Number(value)), 'Penjualan']}
                                labelFormatter={(label) => label}
                            />
                            <Line
                                type="linear"
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
