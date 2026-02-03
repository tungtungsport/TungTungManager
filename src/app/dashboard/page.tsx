"use client";

import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, ShoppingCart, Package, Heart, DollarSign, Loader2, Star } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
};

interface KPIStats {
    monthlyRevenue: number;
    totalOrders: number;
    activeProducts: number;
    totalFavorites: number;
    avgRating: number;
}

interface TopProduct {
    id: string;
    name: string;
    category: string;
    sales: number;
    revenue: number;
    ratingAverage: number;
}

interface MonthlyData {
    month: string;
    revenue: number;
}

interface RatingDistribution {
    stars: number;
    count: number;
}

function KPICard({ title, value, icon: Icon, color = "accent" }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: "accent" | "positive" | "warning";
}) {
    const colorClasses = {
        accent: "text-[#7CFF9B]",
        positive: "text-[#1ED760]",
        warning: "text-[#F2E94E]"
    };

    return (
        <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-[#0A1A13] ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            <p className="text-[#C7D4CE] text-xs uppercase tracking-wider mb-1">{title}</p>
            <p className={`font-numeric text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<KPIStats>({
        monthlyRevenue: 0,
        totalOrders: 0,
        activeProducts: 0,
        totalFavorites: 0,
        avgRating: 0
    });
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [topRatedProducts, setTopRatedProducts] = useState<{ name: string, ratingAverage: number, sales: number }[]>([]);
    const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Date filter
    const {
        filterPeriod, setFilterPeriod,
        selectedMonth, setSelectedMonth,
        selectedYear, setSelectedYear,
        selectedDate, setSelectedDate,
        getDateRange
    } = useDateFilter('monthly');

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);

            // Get revenue for selected period
            const { startDate, endDate } = getDateRange;
            let revenueQuery = supabase
                .from('orders')
                .select('total')
                .eq('status', 'SELESAI');

            if (startDate && endDate) {
                revenueQuery = revenueQuery.gte('created_at', startDate).lte('created_at', endDate);
            } else {
                // Default to current month
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                revenueQuery = revenueQuery.gte('created_at', startOfMonth);
            }

            const { data: monthlyOrders } = await revenueQuery;
            const monthlyRevenue = monthlyOrders?.reduce((sum, o) => sum + o.total, 0) || 0;

            // Get total orders count within date range
            let ordersQuery = supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            if (startDate && endDate) {
                ordersQuery = ordersQuery.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { count: totalOrders } = await ordersQuery;

            // Get active products count
            const { count: activeProducts } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Get total favorites count
            let favQuery = supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true });

            if (startDate && endDate) {
                favQuery = favQuery.gte('created_at', startDate).lte('created_at', endDate);
            }
            const { count: totalFavorites } = await favQuery;

            // Get ratings for the period
            let ratingsQuery = supabase
                .from('ratings')
                .select('rating, product_id, products(name)');

            if (startDate && endDate) {
                ratingsQuery = ratingsQuery.gte('created_at', startDate).lte('created_at', endDate);
            }

            const { data: ratingStats } = await ratingsQuery;

            // Calculate average rating
            const avgRating = ratingStats?.length
                ? ratingStats.reduce((sum, r) => sum + r.rating, 0) / ratingStats.length
                : 0;

            // Calculate rating distribution
            const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            ratingStats?.forEach(r => {
                dist[r.rating] = (dist[r.rating] || 0) + 1;
            });
            const distData = [1, 2, 3, 4, 5].map(s => ({ stars: s, count: dist[s] }));
            setRatingDistribution(distData);

            setStats({
                monthlyRevenue,
                totalOrders: totalOrders || 0,
                activeProducts: activeProducts || 0,
                totalFavorites: totalFavorites || 0,
                avgRating
            });

            // Get top selling products by joining with SELESAI orders within date range
            let orderItemsQuery = supabase
                .from('order_items')
                .select(`
                    product_id, 
                    product_name, 
                    quantity, 
                    total_price,
                    orders!inner(status, created_at)
                `)
                .eq('orders.status', 'SELESAI');

            // Apply date filter to order_items via orders
            if (startDate && endDate) {
                orderItemsQuery = orderItemsQuery
                    .gte('orders.created_at', startDate)
                    .lte('orders.created_at', endDate);
            }

            const { data: orderItemsData } = await orderItemsQuery;

            // Get product aggregates (average rating)
            const { data: productsData } = await supabase
                .from('products')
                .select('id, rating_average, category');

            const productsMap = new Map();
            (productsData || []).forEach(p => productsMap.set(p.id, p));

            const salesMap: Record<string, { id: string; name: string; sales: number; revenue: number; ratingAverage: number; category: string }> = {};
            (orderItemsData || []).forEach((item: any) => {
                if (!salesMap[item.product_id]) {
                    const pInfo = productsMap.get(item.product_id);
                    salesMap[item.product_id] = {
                        id: item.product_id,
                        name: item.product_name,
                        sales: 0,
                        revenue: 0,
                        ratingAverage: pInfo?.rating_average || 0,
                        category: pInfo?.category || 'General'
                    };
                }
                salesMap[item.product_id].sales += item.quantity;
                salesMap[item.product_id].revenue += item.total_price;
            });

            const topProductsArr = Object.values(salesMap)
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);
            setTopProducts(topProductsArr);

            // Top Rated Products (Calculated from filtered ratings)
            const ratedMap: Record<string, { name: string; totalRating: number; count: number; sales: number }> = {};

            (ratingStats || []).forEach((r: any) => {
                const pId = r.product_id;
                const pName = r.products?.name || 'Unknown';

                if (!ratedMap[pId]) {
                    ratedMap[pId] = { name: pName, totalRating: 0, count: 0, sales: salesMap[pId]?.sales || 0 };
                }
                ratedMap[pId].totalRating += r.rating;
                ratedMap[pId].count += 1;
            });

            const topRatedFormatted = Object.values(ratedMap)
                .map(item => ({
                    name: item.name,
                    ratingAverage: item.count > 0 ? item.totalRating / item.count : 0,
                    sales: item.sales
                }))
                .sort((a, b) => b.ratingAverage - a.ratingAverage)
                .slice(0, 4);

            setTopRatedProducts(topRatedFormatted);

            // Chart Data Generation (Daily vs Monthly)
            const chartDataArray: MonthlyData[] = [];

            // Determine if we should show Daily or Monthly view
            // Use Monthly view for 'yearly' or very long ranges
            const isMonthlyView = filterPeriod === 'yearly' || filterPeriod === 'all';

            if (isMonthlyView) {
                // Monthly View Logic (Last 12 months or similar)
                // For 'yearly', we want the last 12 months as per the new filter logic
                const end = endDate ? new Date(endDate) : new Date();
                const start = startDate ? new Date(startDate) : new Date(end.getFullYear(), end.getMonth() - 11, 1);

                // Fetch monthly aggregates
                // We'll reuse the logic to group by month
                const monthOrdersQuery = supabase
                    .from('orders')
                    .select('total, created_at')
                    .eq('status', 'SELESAI')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());

                const { data: mOrders } = await monthOrdersQuery;

                const mRevMap: Record<string, number> = {};
                (mOrders || []).forEach(o => {
                    const d = new Date(o.created_at);
                    // Key: YYYY-MM
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    mRevMap[key] = (mRevMap[key] || 0) + o.total;
                });

                // Generate labels
                // Basic loop for 12 months or range duration
                // If yearly, exactly 12 months
                const monthsCount = 12; // Fixed for yearly
                for (let i = 0; i < monthsCount; i++) {
                    const d = new Date(start);
                    d.setMonth(start.getMonth() + i);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                    chartDataArray.push({ month: label, revenue: mRevMap[key] || 0 });
                }
            } else {
                // Daily View Logic (default for day/week/month)
                // Use startDate/endDate from filter
                // If specific_date, it's just 1 day

                let start = startDate ? new Date(startDate) : new Date();
                let end = endDate ? new Date(endDate) : new Date();

                // Safety: if no range (shouldn't happen with updated DateFilter), default to last 7 days
                if (!startDate) {
                    end = new Date();
                    start = new Date();
                    start.setDate(end.getDate() - 6);
                }

                const dayOrdersQuery = supabase
                    .from('orders')
                    .select('total, created_at')
                    .eq('status', 'SELESAI')
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());

                const { data: dOrders } = await dayOrdersQuery;

                const dRevMap: Record<string, number> = {};
                (dOrders || []).forEach(o => {
                    const dateKey = new Date(o.created_at).toISOString().split('T')[0];
                    dRevMap[dateKey] = (dRevMap[dateKey] || 0) + o.total;
                });

                // Iterate days
                const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
                // Cap at 31 days for safety if something is wrong, but 'monthly' is ~30
                const numDays = Math.max(1, Math.min(dayDiff, 32));

                for (let i = 0; i < numDays; i++) {
                    const d = new Date(start);
                    d.setDate(start.getDate() + i);
                    const key = d.toISOString().split('T')[0];
                    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                    chartDataArray.push({ month: label, revenue: dRevMap[key] || 0 });
                }
            }

            setMonthlyData(chartDataArray);

            setIsLoading(false);
        }

        fetchDashboardData();
    }, [getDateRange]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Dasbor Ringkasan</h1>
                    <p className="text-[#C7D4CE] text-sm mt-1">Tampilan kinerja bisnis</p>
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

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Pendapatan Bulanan"
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={DollarSign}
                    color="accent"
                />
                <KPICard
                    title="Total Pesanan"
                    value={stats.totalOrders.toLocaleString()}
                    icon={ShoppingCart}
                    color="positive"
                />
                <KPICard
                    title="Produk Aktif"
                    value={stats.activeProducts.toString()}
                    icon={Package}
                    color="accent"
                />
                <KPICard
                    title="Rata-rata Rating Produk"
                    value={stats.avgRating.toFixed(1)}
                    icon={Star}
                    color="warning"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend Chart */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">
                        {filterPeriod === 'yearly' ? 'Tren Penjualan Bulanan' : 'Tren Penjualan Harian'}
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" />
                                <XAxis dataKey="month" stroke="#C7D4CE" fontSize={12} />
                                <YAxis
                                    stroke="#C7D4CE"
                                    fontSize={12}
                                    tickFormatter={(value) => formatCurrency(value)}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                    formatter={(value: number | undefined) => [value ? formatCurrency(value) : formatCurrency(0), 'Revenue']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#7CFF9B"
                                    strokeWidth={3}
                                    dot={{ fill: '#7CFF9B', strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, fill: '#1ED760' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Produk Terlaris</h3>
                    <div className="h-64">
                        {topProducts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-[#C7D4CE]">Belum ada data penjualan</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" horizontal={false} />
                                    <XAxis type="number" stroke="#C7D4CE" fontSize={12} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#C7D4CE"
                                        fontSize={11}
                                        width={120}
                                        tick={{ fill: '#C7D4CE' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                        formatter={(value: number | undefined) => [value ?? 0, 'Penjualan']}
                                    />
                                    <Bar dataKey="sales" fill="#1E7F43" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Ratings Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rating Distribution */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Kepuasan Pelanggan (Distribusi Rating)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratingDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" vertical={false} />
                                <XAxis dataKey="stars" stroke="#C7D4CE" fontSize={12} tickFormatter={(val) => `${val} ★`} />
                                <YAxis stroke="#C7D4CE" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                    cursor={{ fill: 'rgba(124, 255, 155, 0.05)' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {ratingDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.stars >= 4 ? '#7CFF9B' : entry.stars >= 3 ? '#F2E94E' : '#FF4D4D'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Highly Rated Products */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Produk dengan Rating Tinggi</h3>
                    <div className="space-y-4">
                        {topRatedProducts.length === 0 ? (
                            <div className="text-center py-8 text-[#C7D4CE]">Belum ada rating produk</div>
                        ) : (
                            topRatedProducts.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-[#0A1A13] border border-[#1A4D35]/50 hover:border-accent/50 transition-colors">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <p className="text-white text-sm font-bold truncate">{p.name}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`h-3 w-3 ${s <= Math.round(p.ratingAverage) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                            ))}
                                            <span className="text-[#C7D4CE] text-[10px] ml-1">({p.ratingAverage.toFixed(1)} / 5)</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-accent text-[10px] font-bold uppercase">{p.sales > 0 ? `${p.sales} Terjual` : 'Baru & Populer'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Ringkasan Performa Produk</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35]">
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Produk</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Unit Terjual</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-[#C7D4CE]">Belum ada data penjualan</td>
                                </tr>
                            ) : (
                                topProducts.map((product, i) => (
                                    <tr key={i} className="border-b border-[#1A4D35] last:border-0">
                                        <td className="py-4 px-4 text-white font-medium">{product.name}</td>
                                        <td className="py-4 px-4 font-numeric text-[#7CFF9B] font-bold">{product.sales}</td>
                                        <td className="py-4 px-4 font-numeric text-white">{formatCurrency(product.revenue)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
