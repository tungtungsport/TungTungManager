"use client";

import { supabase } from "@/lib/supabase";
import { Heart, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useState, useEffect } from "react";

interface FavoritedProduct {
    id: string;
    name: string;
    brand: string;
    favorites: number;
    purchases: number;
}

export default function CustomersPage() {
    const [products, setProducts] = useState<FavoritedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCustomerData() {
            setIsLoading(true);

            // Get most favorited products
            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, brand, favorite_count')
                .order('favorite_count', { ascending: false })
                .limit(10);

            // Get purchase counts for each product from order_items
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, quantity');

            const purchaseMap: Record<string, number> = {};
            (orderItems || []).forEach((item: any) => {
                purchaseMap[item.product_id] = (purchaseMap[item.product_id] || 0) + item.quantity;
            });

            const result = (productsData || []).map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                favorites: p.favorite_count || 0,
                purchases: purchaseMap[p.id] || 0
            }));

            setProducts(result);
            setIsLoading(false);
        }

        fetchCustomerData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#7CFF9B]" />
            </div>
        );
    }

    const totalFavorites = products.reduce((sum, p) => sum + p.favorites, 0);
    const totalPurchases = products.reduce((sum, p) => sum + p.purchases, 0);
    const conversionRate = totalFavorites > 0 ? Math.round((totalPurchases / totalFavorites) * 100) : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-heading text-2xl text-white uppercase tracking-wide">Customer Behavior</h1>
                <p className="text-[#C7D4CE] text-sm mt-1">Wishlist and purchase pattern analysis</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#0A1A13] text-[#D64545]">
                            <Heart className="h-5 w-5 fill-current" />
                        </div>
                        <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Total Favorites</p>
                    </div>
                    <p className="font-numeric text-3xl text-white font-bold">{totalFavorites}</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#0A1A13] text-[#7CFF9B]">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Converted Purchases</p>
                    </div>
                    <p className="font-numeric text-3xl text-[#7CFF9B] font-bold">{totalPurchases}</p>
                </div>
                <div className="bg-[#0F2A1E] border border-[#1A4D35] p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#0A1A13] text-[#1ED760]">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Conversion Rate</p>
                    </div>
                    <p className="font-numeric text-3xl text-[#1ED760] font-bold">{conversionRate}%</p>
                </div>
            </div>

            {/* Favorites vs Purchases Chart */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Wishlist vs Actual Purchases</h3>
                <div className="h-80">
                    {products.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-[#C7D4CE]">No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={products.slice(0, 6)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1A4D35" horizontal={false} />
                                <XAxis type="number" stroke="#C7D4CE" fontSize={12} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#C7D4CE"
                                    fontSize={11}
                                    width={140}
                                    tick={{ fill: '#C7D4CE' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F2A1E', border: '1px solid #1A4D35', color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="favorites" fill="#D64545" name="Favorites" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="purchases" fill="#1ED760" name="Purchases" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#0F2A1E] border border-[#1A4D35] p-6">
                <h3 className="font-heading text-white text-sm uppercase tracking-wider mb-6">Most Favorited Products</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1A4D35]">
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">#</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Product</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Brand</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Favorites</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Purchases</th>
                                <th className="text-left py-4 px-4 text-[#C7D4CE] text-xs uppercase font-bold tracking-wider">Conversion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-[#C7D4CE]">No data yet</td>
                                </tr>
                            ) : (
                                products.map((product, i) => {
                                    const conversion = product.favorites > 0 ? Math.round((product.purchases / product.favorites) * 100) : 0;
                                    return (
                                        <tr key={product.id} className="border-b border-[#1A4D35] last:border-0 hover:bg-[#1A4D35]/30">
                                            <td className="py-4 px-4 font-numeric text-[#7CFF9B]">{i + 1}</td>
                                            <td className="py-4 px-4 text-white font-medium">{product.name}</td>
                                            <td className="py-4 px-4 text-[#C7D4CE]">{product.brand}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="h-4 w-4 text-[#D64545] fill-current" />
                                                    <span className="font-numeric text-white">{product.favorites}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 font-numeric text-[#1ED760] font-bold">{product.purchases}</td>
                                            <td className="py-4 px-4 font-numeric text-white">{conversion}%</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insight */}
            <div className="bg-[#1ED760]/10 border border-[#1ED760]/30 p-5">
                <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-[#1ED760] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[#1ED760] font-bold text-sm uppercase mb-1">Customer Insight</p>
                        <p className="text-[#C7D4CE] text-sm">
                            Favorites indicate customer interest but not guaranteed sales. Products with high favorites but low conversion may need promotional attention.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
