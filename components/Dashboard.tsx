import React, { useMemo, useState } from 'react';
import { Bill } from '../types';
import { StorageService } from '../services/storage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, X } from 'lucide-react';

interface DashboardProps {
  bills: Bill[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ bills }) => {
  const [selectedShop, setSelectedShop] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Compute metrics based on filters
  const metrics = useMemo(() => {
    let filtered = bills;

    if (selectedShop !== 'All') {
      filtered = filtered.filter(b => b.shopName === selectedShop);
    }
    
    // Date Range Filter
    if (startDate) {
        filtered = filtered.filter(b => b.date >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(b => b.date <= endDate);
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    const shopSales: Record<string, number> = {};
    const productSales: Record<string, number> = {};
    const monthlyTrend: Record<string, { revenue: number, profit: number }> = {};

    filtered.forEach(bill => {
      totalRevenue += bill.totalAmount;
      
      // Shop breakdown
      shopSales[bill.shopName] = (shopSales[bill.shopName] || 0) + bill.totalAmount;

      // Month trend (Grouping by month for the chart)
      const monthKey = bill.date.substring(0, 7); // YYYY-MM
      if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = { revenue: 0, profit: 0 };
      monthlyTrend[monthKey].revenue += bill.totalAmount;

      bill.items.forEach(item => {
        totalItemsSold += item.quantity;
        
        // Cost calc
        const mfgCost = StorageService.getManufacturingCost(item.productName);
        const itemCost = mfgCost * item.quantity;
        totalCost += itemCost;
        
        // Monthly profit update
        monthlyTrend[monthKey].profit += (item.total - itemCost);

        // Product breakdown
        productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit;

    return {
      totalRevenue,
      grossProfit,
      netProfit,
      totalItemsSold,
      shopSales: Object.entries(shopSales).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      productSales: Object.entries(productSales).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5),
      monthlyTrend: Object.entries(monthlyTrend).map(([name, data]) => ({ name, ...data })).sort((a,b) => a.name.localeCompare(b.name))
    };
  }, [bills, selectedShop, startDate, endDate]);

  // Unique Shops for Filter
  const shops = useMemo(() => Array.from(new Set(bills.map(b => b.shopName))), [bills]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Dashboard</h2>
            <p className="text-gray-500">Overview of your retail performance.</p>
        </div>
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center w-full md:w-auto">
            <select 
                value={selectedShop} 
                onChange={(e) => setSelectedShop(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[150px] w-full md:w-auto"
            >
                <option value="All">All Shops</option>
                {shops.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-300 w-full md:w-auto">
                <div className="flex items-center px-2 flex-1 md:flex-none">
                    <span className="text-xs text-gray-500 font-semibold mr-2 uppercase">From</span>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm outline-none text-slate-700 bg-transparent font-medium w-full md:w-auto"
                    />
                </div>
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex items-center px-2 flex-1 md:flex-none">
                    <span className="text-xs text-gray-500 font-semibold mr-2 uppercase">To</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-sm outline-none text-slate-700 bg-transparent font-medium w-full md:w-auto"
                    />
                </div>
                {(startDate || endDate) && (
                    <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear Dates"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">₹{metrics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                    <DollarSign className="w-6 h-6" />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Gross Profit</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">₹{metrics.grossProfit.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Items Sold</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.totalItemsSold}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <ShoppingBag className="w-6 h-6" />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Margin</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                        {metrics.totalRevenue > 0 ? ((metrics.grossProfit / metrics.totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                    <PieChart className="w-6 h-6" />
                </div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue & Profit Trend</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} />
                        <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} name="Revenue" dot={{r: 4}} />
                        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" dot={{r: 4}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Shop Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Shop Sales Distribution</h3>
            <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={metrics.shopSales}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {metrics.shopSales.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Top Products */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Top 5 Products (Volume)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.productSales} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
};