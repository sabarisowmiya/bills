import React, { useMemo, useState, useEffect } from 'react';
import { Bill, ShopMaster } from '../types';
import { StorageService } from '../services/storage';
import { Store, TrendingUp, ArrowLeft, Calendar, FileText, Plus, Trash2, Receipt } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { BillDetail } from './BillDetail';

interface ShopsProps {
  bills: Bill[];
}

export const Shops: React.FC<ShopsProps> = ({ bills }) => {
  const [viewShop, setViewShop] = useState<string | null>(null);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [knownShops, setKnownShops] = useState<ShopMaster[]>([]);
  const [newShopName, setNewShopName] = useState('');

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
    return bills.filter(b => b.shopName === viewShop).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bills, viewShop]);

  const selectedShopStats = useMemo(() => {
    return shopStats.find(s => s.name === viewShop);
  }, [shopStats, viewShop]);

  const handleAddShop = () => {
    if(!newShopName.trim()) return;
    if(knownShops.find(s => s.name.toLowerCase() === newShopName.toLowerCase())) {
        alert('Shop already exists');
        return;
    }
    const newShop: ShopMaster = { id: uuidv4(), name: newShopName.trim() };
    StorageService.saveShop(newShop);
    setKnownShops(StorageService.getShops());
    setNewShopName('');
  };

  const handleDeleteShop = (e: React.MouseEvent, shopName: string) => {
      e.stopPropagation();
      const shop = knownShops.find(s => s.name === shopName);
      if(!shop) return; // Only delete known shops manually
      
      if(confirm('Remove this shop from the list? Stats from existing bills will remain, but it will be removed from autocomplete if no bills exist.')) {
          StorageService.deleteShop(shop.id);
          setKnownShops(StorageService.getShops());
      }
  }

  // --- Render Views ---

  // 3. Bill Detail View (Invoice Style)
  if (viewBill) {
      return <BillDetail bill={viewBill} onBack={() => setViewBill(null)} />;
  }

  // 2. Shop Detail View
  if (viewShop && selectedShopStats) {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setViewShop(null)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-2xl font-serif font-bold text-slate-800">{viewShop}</h2>
                    <p className="text-gray-500">Detailed performance and bill history.</p>
                </div>
            </div>

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
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400 group-hover:text-indigo-400"/>
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
                    <Plus className="w-4 h-4 mr-2" /> Add Shop
                </button>
            </div>
        </div>

      {/* Shop Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shopStats.map(shop => {
            const isKnown = knownShops.some(ks => ks.name === shop.name);
            return (
            <div 
                key={shop.name} 
                onClick={() => setViewShop(shop.name)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all transform hover:-translate-y-1 relative group"
            >
                {isKnown && (
                    <button 
                        type="button"
                        onClick={(e) => handleDeleteShop(e, shop.name)}
                        className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from shop list"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}

                <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{shop.name}</h3>
                    <p className="text-sm text-gray-500">{shop.billCount} Bills</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Store className="w-5 h-5" />
                </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Revenue</span>
                        <span className="font-medium text-slate-800">₹{shop.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Profit</span>
                        <span className="font-medium text-green-600">₹{shop.profit.toLocaleString()}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500">
                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                        <span className="text-green-600 font-medium mr-1">
                            {shop.revenue > 0 ? ((shop.profit / shop.revenue) * 100).toFixed(0) : 0}%
                        </span> 
                        Margin
                    </div>
                </div>
            </div>
        )})}
         {shopStats.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No shop data available. Add a shop manually or upload bills.</p>
            </div>
        )}
      </div>

       {shopStats.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Comparison</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={shopStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <RechartsTooltip cursor={{fill: '#f9fafb'}} />
                        <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
       )}
    </div>
  );
};