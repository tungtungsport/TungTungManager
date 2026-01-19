"use client";

import { supabase } from "@/lib/supabase";
import { TrendingUp, TrendingDown, ShoppingCart, Package, Heart, DollarSign, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";

interface KPIStats {
    monthlyRevenue: number;
    totalOrders: number;
    activeProducts: number;
    totalFavorites: number;
}

interface TopProduct {
    name: string;
    category: string;
    sales: number;
    revenue: number;
}

interface MonthlyData {
    month: string;
    revenue: number;
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
        totalFavorites: 0
    });
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            setIsLoading(true);

            // Get current month's revenue
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data: monthlyOrders } = await supabase
                .from('orders')
                .select('total')
                .gte('created_at', startOfMonth)
                .eq('status', 'COMPLETED');
            const monthlyRevenue = monthlyOrders?.reduce((sum, o) => sum + o.total, 0) || 0;

            // Get total orders count
            const { count: totalOrders } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true });

            // Get active products count
            const { count: activeProducts } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Get total favorites count
            const { count: totalFavorites } = await supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true });

            setStats({
                monthlyRevenue,
                totalOrders: totalOrders || 0,
                activeProducts: activeProducts || 0,
                totalFavorites: totalFavorites || 0
            });

            // Get top selling products from order_items
            const { data: orderItemsData } = await supabase
                .from('order_items')
                .select('product_id, product_name, quantity, total_price');

            const salesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
            (orderItemsData || []).forEach((item: any) => {
                if (!salesMap[item.product_id]) {
                    salesMap[item.product_id] = { name: item.product_name, sales: 0, revenue: 0 };
                }
                salesMap[item.product_id].sales += item.quantity;
                salesMap[item.product_id].revenue += item.total_price;
            });

            const topProductsArr = Object.values(salesMap)
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5)
                .map(p => ({ ...p, category: 'Futsal' }));
            setTopProducts(topProductsArr);

            // Get monthly revenue for the last 6 months
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyRevData: MonthlyData[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

                const { data: monthOrders } = await supabase
                    .from('orders')
                    .select('total')
                    .gte('created_at', monthStart)
                    .lte('created_at', monthEnd)
                    .eq('status', 'COMPLETED');

                const revenue = monthOrders?.reduce((sum, o) => sum + o.total, 0) || 0;
                monthlyRevData.push({ month: months[date.getMonth()], revenue });
            }
            setMonthlyData(monthlyRevData);

            setIsLoading(false);
        }

        fetchDashboardData();
    }, []);

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
            <div>
                <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Overview Dashboard</h1>
                <p className="text-[#C7D4CE] text-sm mt-1">Business performance snapshot</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Monthly Revenue"
                    value={`Rp ${(stats.monthlyRevenue / 1000000).toFixed(1)}M`}
                    icon={DollarSign}
                    color="accent"
                />
                <KPICard
                    title="Total Orders"
                    value={stats.totalOrders.toLocaleString()}
                    icon={ShoppingCart}
                    color="positive"
                />
                <KPICard
                    title="Active Products"
                    value={stats.activeProducts.toString()}
                    icon={Package}
                    color="accent"
                />
                <KPICard
                    title="Total Favorites"
                    value={stats.totalFavorites.toString()}
                    icon={Heart}
                    color="warning"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales Trend */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Monthly Sales Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" />
                                <XAxis dataKey="month" stroke="#C7D4CE" fontSize={12} />
                                <YAxis
                                    stroke="#C7D4CE"
                                    fontSize={12}
                                    tickFormatter={(value) => `${(value / 1000000)}M`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                    formatter={(value: number | undefined) => [value ? `Rp ${(value / 1000000).toFixed(1)}M` : 'Rp 0M', 'Revenue']}
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
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Top Selling Products</h3>
                    <div className="h-64">
                        {topProducts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-[#C7D4CE]">No sales data yet</div>
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
                                        formatter={(value: number | undefined) => [value ?? 0, 'Sales']}
                                    />
                                    <Bar dataKey="sales" fill="#1E7F43" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Product Performance Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35]">
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Product</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Units Sold</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-[#C7D4CE]">No sales data yet</td>
                                </tr>
                            ) : (
                                topProducts.map((product, i) => (
                                    <tr key={i} className="border-b border-[#1A4D35] last:border-0">
                                        <td className="py-4 px-4 text-white font-medium">{product.name}</td>
                                        <td className="py-4 px-4 font-numeric text-[#7CFF9B] font-bold">{product.sales}</td>
                                        <td className="py-4 px-4 font-numeric text-white">Rp {(product.revenue / 1000000).toFixed(1)}M</td>
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
