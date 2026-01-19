"use client";

import { supabase } from "@/lib/supabase";
import { AlertTriangle, Package, TrendingDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface LowStockProduct {
    id: string;
    name: string;
    category: string;
    stock: number;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<LowStockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInventory() {
            setIsLoading(true);

            const { data } = await supabase
                .from('products')
                .select('id, name, category, stock')
                .lte('stock', 10)
                .eq('status', 'active')
                .order('stock', { ascending: true });

            setProducts(data || []);
            setIsLoading(false);
        }

        fetchInventory();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

    const getRiskLevel = (stock: number) => {
        if (stock === 0) return { label: "Out of Stock", color: "bg-[#D64545]", textColor: "text-[#D64545]" };
        if (stock <= 3) return { label: "Critical", color: "bg-[#D64545]/50", textColor: "text-[#D64545]" };
        if (stock <= 5) return { label: "Low", color: "bg-[#F2E94E]/50", textColor: "text-[#F2E94E]" };
        return { label: "Watch", color: "bg-[#7CFF9B]/20", textColor: "text-[#7CFF9B]" };
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Inventory Insights</h1>
                <p className="text-[#C7D4CE] text-sm mt-1">Stock condition monitoring and risk assessment</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#0A1A13] text-[#D64545]">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Out of Stock</p>
                    </div>
                    <p className="font-numeric text-3xl text-[#D64545] font-bold">{outOfStock}</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#0A1A13] text-[#F2E94E]">
                            <TrendingDown className="h-5 w-5" />
                        </div>
                        <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Low Stock Items</p>
                    </div>
                    <p className="font-numeric text-3xl text-[#F2E94E] font-bold">{lowStock}</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#0A1A13] text-[#7CFF9B]">
                            <Package className="h-5 w-5" />
                        </div>
                        <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Items Monitored</p>
                    </div>
                    <p className="font-numeric text-3xl text-[#7CFF9B] font-bold">{products.length}</p>
                </div>
            </div>

            {/* Low Stock Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Products Requiring Attention</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35]">
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Product Name</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Category</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Current Stock</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-[#C7D4CE]">All products are well stocked!</td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const risk = getRiskLevel(product.stock);
                                    return (
                                        <tr key={product.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                            <td className="py-4 px-4 text-white font-medium">{product.name}</td>
                                            <td className="py-4 px-4 text-[#C7D4CE]">{product.category || 'N/A'}</td>
                                            <td className={`py-4 px-4 font-numeric font-bold ${risk.textColor}`}>
                                                {product.stock}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-block px-3 py-1 text-xs font-bold uppercase ${risk.color} ${risk.textColor}`}>
                                                    {risk.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insight Box */}
            {outOfStock > 0 && (
                <div className="bg-[#F2E94E]/10 border border-[#F2E94E]/30 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-[#F2E94E] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[#F2E94E] font-bold text-sm uppercase mb-1">Inventory Alert</p>
                            <p className="text-[#C7D4CE] text-sm">
                                {outOfStock} product(s) are out of stock. Consider immediate restocking to avoid lost sales.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
