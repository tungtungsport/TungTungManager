// Manager User
export const managerUser = {
    id: "MGR-001",
    name: "Manager Tung Tung Sport",
    email: "manager@tungtungsport.com",
    role: "MANAGER"
};

// Monthly Revenue Data (12 months)
export const monthlyRevenue = [
    { month: "Feb", revenue: 352000000 },
    { month: "Mar", revenue: 385000000 },
    { month: "Apr", revenue: 410000000 },
    { month: "May", revenue: 398000000 },
    { month: "Jun", revenue: 425000000 },
    { month: "Jul", revenue: 448000000 },
    { month: "Aug", revenue: 462000000 },
    { month: "Sep", revenue: 445000000 },
    { month: "Oct", revenue: 478000000 },
    { month: "Nov", revenue: 495000000 },
    { month: "Dec", revenue: 520000000 },
    { month: "Jan", revenue: 486500000 },
];

// Daily Sales (last 30 days)
export const dailySales = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    sales: Math.floor(12000000 + Math.random() * 8000000),
}));

// Top Selling Products
export const topSellingProducts = [
    { name: "Nike Tiempo Legend 9", category: "Futsal", sales: 245, revenue: 612500000 },
    { name: "Adidas Predator Edge", category: "Football", sales: 198, revenue: 534600000 },
    { name: "Puma Future Z", category: "Futsal", sales: 176, revenue: 422400000 },
    { name: "Nike Phantom GT", category: "Football", sales: 152, revenue: 380000000 },
    { name: "Specs Accelerator", category: "Futsal", sales: 134, revenue: 160800000 },
];

// Category Distribution
export const categoryDistribution = [
    { category: "Futsal Shoes", percentage: 58, revenue: 282170000 },
    { category: "Football Shoes", percentage: 32, revenue: 155680000 },
    { category: "Accessories", percentage: 10, revenue: 48650000 },
];

// Low Stock Products
export const lowStockProducts = [
    { id: "PRD-003", name: "Ultra Ultimate FG/AG", category: "Football", stock: 3, avgSales: 12 },
    { id: "PRD-007", name: "Top Sala Competition", category: "Futsal", stock: 2, avgSales: 8 },
    { id: "PRD-011", name: "X Crazyfast.1", category: "Football", stock: 1, avgSales: 15 },
    { id: "PRD-005", name: "Mercurial Vapor 15", category: "Football", stock: 0, avgSales: 18 },
];

// Most Favorited Products
export const mostFavoritedProducts = [
    { name: "Mercurial Vapor 15", brand: "Nike", favorites: 52, purchases: 38 },
    { name: "Phantom GX Elite FG", brand: "Nike", favorites: 47, purchases: 32 },
    { name: "X Crazyfast.1", brand: "Adidas", favorites: 42, purchases: 28 },
    { name: "Predator Accuracy.1", brand: "Adidas", favorites: 38, purchases: 25 },
    { name: "Tiempo Legend 10", brand: "Nike", favorites: 36, purchases: 30 },
    { name: "Future Ultimate", brand: "Puma", favorites: 33, purchases: 22 },
];

// KPI Stats
export const kpiStats = {
    monthlyRevenue: 486500000,
    revenueTrend: 15,
    totalOrders: 1248,
    ordersTrend: 8,
    activeProducts: 86,
    productsTrend: 5,
    totalFavorites: 376,
    favoritesTrend: 12,
};

// Average Order Value Trend
export const avgOrderValueTrend = [
    { month: "Aug", value: 385000 },
    { month: "Sep", value: 392000 },
    { month: "Oct", value: 405000 },
    { month: "Nov", value: 418000 },
    { month: "Dec", value: 432000 },
    { month: "Jan", value: 390000 },
];
