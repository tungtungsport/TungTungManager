"use client";

import { supabase } from "@/lib/supabase";
import { FileText, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DateFilter, useDateFilter } from "@/components/DateFilter";

interface ReportStats {
    monthlyRevenue: number;
    totalOrders: number;
    activeProducts: number;
    totalFavorites: number;
}

interface TopProduct {
    name: string;
    sales: number;
    revenue: number;
}

interface CategoryData {
    category: string;
    percentage: number;
    revenue: number;
}

const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
};

export default function ReportsPage() {
    const [stats, setStats] = useState<ReportStats>({
        monthlyRevenue: 0,
        totalOrders: 0,
        activeProducts: 0,
        totalFavorites: 0
    });
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
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
        async function fetchReportData() {
            try {
                setIsLoading(true);

                // Monthly revenue - use filtered period
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

                // Total orders (SELESAI)
                const { count: totalOrders } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'SELESAI');

                // Active products
                const { count: activeProducts } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');

                // Total favorites
                const { count: totalFavorites } = await supabase
                    .from('favorites')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    monthlyRevenue,
                    totalOrders: totalOrders || 0,
                    activeProducts: activeProducts || 0,
                    totalFavorites: totalFavorites || 0
                });

                // Top products (filtered by SELESAI status)
                const { data: orderItems } = await supabase
                    .from('order_items')
                    .select(`
                        product_name, 
                        quantity, 
                        total_price,
                        orders!inner(status)
                    `)
                    .eq('orders.status', 'SELESAI');

                const salesMap: Record<string, { sales: number; revenue: number }> = {};
                (orderItems || []).forEach((item: any) => {
                    if (!salesMap[item.product_name]) {
                        salesMap[item.product_name] = { sales: 0, revenue: 0 };
                    }
                    salesMap[item.product_name].sales += item.quantity;
                    salesMap[item.product_name].revenue += item.total_price;
                });

                const topProductsArr = Object.entries(salesMap)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5);
                setTopProducts(topProductsArr);

                // Category distribution - simplified query
                const { data: products } = await supabase
                    .from('products')
                    .select('category, price')
                    .eq('status', 'active');

                const catMap: Record<string, number> = {};
                let catTotal = 0;
                (products || []).forEach((p: any) => {
                    const cat = p.category || 'Other';
                    catMap[cat] = (catMap[cat] || 0) + 1;
                    catTotal += 1;
                });

                const catData = Object.entries(catMap)
                    .map(([category, count]) => ({
                        category,
                        revenue: count,
                        percentage: catTotal > 0 ? Math.round((count / catTotal) * 100) : 0
                    }))
                    .sort((a, b) => b.percentage - a.percentage);
                setCategories(catData);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchReportData();
    }, [getDateRange]);

    const handleExportCSV = () => {
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Build CSV content
        let csv = 'Tung Tung Sport - Monthly Report\n';
        csv += `Period: ${currentMonth}\n\n`;

        csv += 'SUMMARY\n';
        csv += 'Metric,Value\n';
        csv += `Monthly Revenue,${formatCurrency(stats.monthlyRevenue)}\n`;
        csv += `Total Orders,${stats.totalOrders}\n`;
        csv += `Active Products,${stats.activeProducts}\n`;
        csv += `Total Favorites,${stats.totalFavorites}\n\n`;

        csv += 'TOP PRODUCTS\n';
        csv += 'Rank,Product,Units Sold,Revenue\n';
        topProducts.forEach((p, i) => {
            csv += `${i + 1},${p.name},${p.sales},${formatCurrency(p.revenue)}\n`;
        });
        csv += '\n';

        csv += 'CATEGORY DISTRIBUTION\n';
        csv += 'Category,Percentage,Count\n';
        categories.forEach(c => {
            csv += `${c.category},${c.percentage}%,${c.revenue}\n`;
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tung-tung-sport-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportPDF = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8 print:bg-white print:text-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl text-white uppercase tracking-wide print:text-black">Laporan</h1>
                    <p className="text-[#C7D4CE] text-sm mt-1 print:text-gray-600">Buat dan ekspor laporan manajemen</p>
                </div>
                <div className="flex items-center gap-3">
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
                    <div className="flex gap-3 print:hidden">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 bg-[#D64545] hover:bg-[#D64545]/80 text-white px-4 py-2 font-bold uppercase text-sm transition-colors"
                        >
                            <Download className="h-4 w-4" /> Export PDF
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 bg-[#1E7F43] hover:bg-[#1E7F43]/80 text-white px-4 py-2 font-bold uppercase text-sm transition-colors"
                        >
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Summary */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6 print:bg-white print:border-gray-300">
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="h-5 w-5 text-[#7CFF9B] print:text-green-600" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider print:text-black">Ringkasan Bulanan - {currentMonth}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-[#1A4D35] print:border-gray-300">
                            <span className="text-[#C7D4CE] print:text-gray-600">Total Pendapatan</span>
                            <span className="font-numeric text-[#7CFF9B] font-bold print:text-green-600">{formatCurrency(stats.monthlyRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-[#1A4D35] print:border-gray-300">
                            <span className="text-[#C7D4CE] print:text-gray-600">Total Pesanan</span>
                            <span className="font-numeric text-white font-bold print:text-black">{stats.totalOrders.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-[#1A4D35] print:border-gray-300">
                            <span className="text-[#C7D4CE] print:text-gray-600">Produk Aktif</span>
                            <span className="font-numeric text-white font-bold print:text-black">{stats.activeProducts}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-[#C7D4CE] print:text-gray-600">Favorit Pelanggan</span>
                            <span className="font-numeric text-white font-bold print:text-black">{stats.totalFavorites}</span>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6 print:bg-white print:border-gray-300">
                    <div className="flex items-center gap-2 mb-6">
                        <FileText className="h-5 w-5 text-[#7CFF9B] print:text-green-600" />
                        <h3 className="font-heading text-white text-sm uppercase tracking-wider print:text-black">Rincian Kategori</h3>
                    </div>
                    <div className="space-y-4">
                        {categories.length === 0 ? (
                            <p className="text-[#C7D4CE] text-center py-4">Belum ada data</p>
                        ) : (
                            categories.map((cat, i) => (
                                <div key={i} className="py-3 border-b border-[#1A4D35] last:border-0 print:border-gray-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-medium print:text-black">{cat.category}</span>
                                        <span className="font-numeric text-[#7CFF9B] print:text-green-600">{cat.percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#0A1A13] rounded print:bg-gray-200">
                                        <div
                                            className="h-full bg-[#1E7F43] rounded print:bg-green-500"
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Top Products Report */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6 print:bg-white print:border-gray-300">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-5 w-5 text-[#7CFF9B] print:text-green-600" />
                    <h3 className="font-heading text-white text-sm uppercase tracking-wider print:text-black">Laporan Produk Terlaris</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35] print:border-gray-300">
                                <th className="text-left py-3 px-4 text-[#C7D4  CE] text-xs uppercase font-bold tracking-wider print:text-gray-600">Peringkat</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider print:text-gray-600">Produk</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider print:text-gray-600">Unit Terjual</th>
                                <th className="text-left py-3 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider print:text-gray-600">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-[#C7D4CE]">Belum ada data penjualan</td>
                                </tr>
                            ) : (
                                topProducts.map((product, i) => (
                                    <tr key={i} className="border-b border-[#1A4D35] last:border-0 print:border-gray-300">
                                        <td className="py-4 px-4 font-numeric text-[#7CFF9B] font-bold print:text-green-600">{i + 1}</td>
                                        <td className="py-4 px-4 text-white font-medium print:text-black">{product.name}</td>
                                        <td className="py-4 px-4 font-numeric text-white print:text-black">{product.sales}</td>
                                        <td className="py-4 px-4 font-numeric text-[#1ED760] font-bold print:text-green-600">{formatCurrency(product.revenue)}</td>
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
