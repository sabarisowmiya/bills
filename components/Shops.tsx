import React, { useMemo, useState, useEffect } from 'react';
import { Bill, ShopMaster } from '../types';
import { StorageService } from '../services/storage';
import { Store, TrendingUp, ArrowLeft, Calendar, FileText, Plus, Trash2, Receipt, Pencil, Save, X, AlertTriangle, PieChart as PieChartIcon, BarChart2, DollarSign, ShoppingBag } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { BillDetail } from './BillDetail';

interface ShopsProps {
    bills: Bill[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Shops: React.FC<ShopsProps> = ({ bills }) => {
    const [viewShop, setViewShop] = useState<string | null>(null);
    const [viewBill, setViewBill] = useState<Bill | null>(null);
    const [knownShops, setKnownShops] = useState<ShopMaster[]>([]);
    const [newShopName, setNewShopName] = useState('');

    // Editing State
    const [isEditingShop, setIsEditingShop] = useState(false);
    const [editShopName, setEditShopName] = useState('');

    // Analytics State
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        setKnownShops(StorageService.getShops());
    }, []);

    // Calculate stats for all shops (merging known shops with bill data)
    const shopStats = useMemo(() => {
        const stats: Record<string, { name: string, revenue: number, profit: number, billCount: number }> = {};

        // 1. Initialize with known shops (stats 0)
        knownShops.forEach(shop => {
            stats[shop.name] = { name: shop.name, revenue: 0, profit: 0, billCount: 0 };
        });

        // 2. Aggregate bill data (will override or add to stats)
        bills.forEach(bill => {
            if (!stats[bill.shopName]) {
                stats[bill.shopName] = { name: bill.shopName, revenue: 0, profit: 0, billCount: 0 };
            }

            stats[bill.shopName].revenue += bill.totalAmount;
            stats[bill.shopName].billCount += 1;

            let billProfit = 0;
            bill.items.forEach(item => {
                const mfgCost = StorageService.getManufacturingCost(item.productName);
                const itemCost = mfgCost * item.quantity;
                billProfit += (item.total - itemCost);
            });
            stats[bill.shopName].profit += billProfit;
        });

        return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
    }, [bills, knownShops]);

    // Filter bills for selected shop
    const selectedShopBills = useMemo(() => {
        if (!viewShop) return [];
        return bills.filter(b => b.shopName === viewShop).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bills, viewShop]);

    const selectedShopStats = useMemo(() => {
        return shopStats.find(s => s.name === viewShop);
    }, [shopStats, viewShop]);

    // Analytics Data Calculation
    const analyticsData = useMemo(() => {
        if (!viewShop) return null;

        let filtered = selectedShopBills;

        // Date Filtering
        if (startDate) {
            filtered = filtered.filter(b => b.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(b => b.date <= endDate);
        }

        let totalRevenue = 0;
        let totalCost = 0;
        let totalItemsSold = 0;
        const productSales: Record<string, number> = {};
        const monthlyTrend: Record<string, { revenue: number, profit: number }> = {};

        filtered.forEach(bill => {
            totalRevenue += bill.totalAmount;

            const monthKey = bill.date.substring(0, 7); // YYYY-MM
            if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = { revenue: 0, profit: 0 };
            monthlyTrend[monthKey].revenue += bill.totalAmount;

            bill.items.forEach(item => {
                totalItemsSold += item.quantity;

                const mfgCost = StorageService.getManufacturingCost(item.productName);
                const itemCost = mfgCost * item.quantity;
                totalCost += itemCost;

                monthlyTrend[monthKey].profit += (item.total - itemCost);

                productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
            });
        });

        const grossProfit = totalRevenue - totalCost;

        return {
            totalRevenue,
            grossProfit,
            totalItemsSold,
            billCount: filtered.length,
            productSales: Object.entries(productSales).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
            monthlyTrend: Object.entries(monthlyTrend).map(([name, data]) => ({ name, ...data })).sort((a, b) => a.name.localeCompare(b.name))
        };
    }, [selectedShopBills, startDate, endDate, viewShop]);


    const handleAddShop = () => {
        if (!newShopName.trim()) return;
        if (knownShops.find(s => s.name.toLowerCase() === newShopName.toLowerCase())) {
            alert('Shop already exists');
            return;
        }
        const newShop: ShopMaster = { id: uuidv4(), name: newShopName.trim() };
        StorageService.saveShop(newShop);
        setKnownShops(StorageService.getShops());
        setNewShopName('');
    };

    const handleSaveRename = () => {
        if (!viewShop || !editShopName.trim()) return;

        const shopMaster = knownShops.find(s => s.name === viewShop);

        if (!shopMaster) {
            const newShop: ShopMaster = { id: uuidv4(), name: editShopName.trim() };
            StorageService.saveShop(newShop);
            alert("This shop was not in your master list. It has been added now.");
            setKnownShops(StorageService.getShops());
            setIsEditingShop(false);
            return;
        }

        StorageService.updateShopAndBills(shopMaster.id, editShopName.trim());
        setKnownShops(StorageService.getShops());
        setViewShop(editShopName.trim());
        setIsEditingShop(false);
    };

    const handleDeleteCurrentShop = () => {
        if (!viewShop) return;
        const shopMaster = knownShops.find(s => s.name === viewShop);

        if (window.confirm(`Are you sure you want to delete "${viewShop}"? \n\nNote: The bills will remain in history, but the shop will be removed from your list.`)) {
            if (shopMaster) {
                StorageService.deleteShop(shopMaster.id);
                setKnownShops(StorageService.getShops());
            }
            setViewShop(null);
        }
    };

    const handleStartEdit = () => {
        setEditShopName(viewShop || '');
        setIsEditingShop(true);
    }

    // --- Render Views ---

    // 3. Bill Detail View
    if (viewBill) {
        return <BillDetail bill={viewBill} onBack={() => setViewBill(null)} />;
    }

    // 2. Shop Detail View
    if (viewShop && selectedShopStats) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-4 w-full">
                        <button
                            onClick={() => { setViewShop(null); setShowAnalytics(false); }}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>

                        <div className="flex-1">
                            {isEditingShop ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editShopName}
                                        onChange={(e) => setEditShopName(e.target.value)}
                                        className="text-2xl font-serif font-bold text-slate-800 border-b-2 border-indigo-500 focus:outline-none bg-transparent w-full md:w-auto"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-slate-800">{viewShop}</h2>
                                    <p className="text-gray-500">{showAnalytics ? 'Performance Analytics' : 'Detailed performance and bill history.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Controls */}
                    <div className="flex items-center space-x-2">
                        {isEditingShop ? (
                            <>
                                <button
                                    onClick={handleDeleteCurrentShop}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center mr-2"
                                    title="Delete Shop"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </button>
                                <button
                                    onClick={handleSaveRename}
                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                    title="Save Name"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsEditingShop(false)}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Cancel"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                {/* Analytics Toggle Button */}
                                <button
                                    onClick={() => setShowAnalytics(!showAnalytics)}
                                    className={`flex items-center px-4 py-2 border rounded-lg transition-colors shadow-sm ${showAnalytics ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <BarChart2 className="w-4 h-4 mr-2" />
                                    {showAnalytics ? 'Show History' : 'Analytics'}
                                </button>

                                <button
                                    onClick={handleStartEdit}
                                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <Pencil className="w-4 h-4 mr-2" /> Edit Shop
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ANALYTICS VIEW */}
                {showAnalytics && analyticsData ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Date Filters */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Period:</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="text-sm px-3 py-1.5 border border-gray-300 rounded-md outline-none focus:border-indigo-500"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="text-sm px-3 py-1.5 border border-gray-300 rounded-md outline-none focus:border-indigo-500"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium ml-auto"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Revenue</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">₹{analyticsData.totalRevenue.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Profit</p>
                                    <p className="text-2xl font-bold text-emerald-600 mt-1">₹{analyticsData.grossProfit.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Bills</p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-1">{analyticsData.billCount}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Items Sold</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">{analyticsData.totalItemsSold}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analyticsData.monthlyTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                            <RechartsTooltip />
                                            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Top Products</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.productSales} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                            <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    /* EXISTING SHOP SUMMARY & BILL LIST */
                    <>
                        {/* Shop Summary Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Revenue</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">₹{selectedShopStats.revenue.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Profit</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">₹{selectedShopStats.profit.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Bills Count</p>
                                <p className="text-2xl font-bold text-indigo-600 mt-1">{selectedShopStats.billCount}</p>
                            </div>
                        </div>

                        {/* Bill List Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-gray-700">Bill History</h3>
                            </div>
                            {selectedShopBills.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Items</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedShopBills.map(bill => (
                                            <tr
                                                key={bill.id}
                                                onClick={() => setViewBill(bill)}
                                                className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-900 flex items-center group-hover:text-indigo-700">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400 group-hover:text-indigo-400" />
                                                    {bill.date}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 group-hover:text-indigo-700">
                                                    <span className="flex items-center">
                                                        <FileText className="w-4 h-4 mr-2 text-gray-400 group-hover:text-indigo-400" />
                                                        {bill.invoiceNumber || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 text-center">{bill.items.length}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-800 text-right group-hover:text-indigo-700">₹{bill.totalAmount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className="text-gray-400 group-hover:text-indigo-500">
                                                        <Receipt className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    No bills recorded for this shop yet.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // 1. Shop List View (Default)
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-800">Shops</h2>
                    <p className="text-gray-500">Manage shops and view performance analysis.</p>
                </div>
            </div>

            {/* Add Shop Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Add New Shop</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        placeholder="Enter Shop Name"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                        onClick={handleAddShop}
                        className="px-6 py-2 bg-slate-850 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </button>
                </div>
            </div>

            {/* Shop Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shopStats.map(stat => (
                    <div
                        key={stat.name}
                        onClick={() => setViewShop(stat.name)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Store className="w-6 h-6" />
                            </div>
                            {/* Simple Mini Chart Placeholder */}
                            <div className="text-green-500 flex items-center text-sm font-medium">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Active
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{stat.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{stat.billCount} Bills Recorded</p>

                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Revenue</p>
                                <p className="font-bold text-slate-800">₹{stat.revenue.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase">Profit</p>
                                <p className="font-bold text-emerald-600">₹{stat.profit.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {shopStats.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 italic">
                        No shops found. Add a shop manually or upload a bill to auto-create one.
                    </div>
                )}
            </div>
        </div>
    );
};