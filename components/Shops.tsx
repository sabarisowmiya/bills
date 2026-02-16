import React, { useMemo, useState, useEffect } from 'react';
import { Bill, ShopMaster } from '../types';
import { StorageService } from '../services/storage';
import { Store, TrendingUp, ArrowLeft, Calendar, FileText, Plus, Trash2, Receipt, Pencil, Save, X, AlertTriangle } from 'lucide-react';
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

  // Editing State
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [editShopName, setEditShopName] = useState('');

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

  const handleSaveRename = () => {
      if (!viewShop || !editShopName.trim()) return;
      
      const shopMaster = knownShops.find(s => s.name === viewShop);
      
      // If shop isn't in master list yet, create it
      if (!shopMaster) {
          const newShop: ShopMaster = { id: uuidv4(), name: editShopName.trim() };
          StorageService.saveShop(newShop);
          // We also need to update the bills associated with the old "raw" name
          // Since saveShop didn't do that, we manually trigger the update logic conceptually
          // But StorageService.updateShopAndBills requires an ID. 
          // Limitation: If it's a raw shop name, we can't rename it easily without an ID.
          // Fallback: Just update bills directly for now, or alert user to add it first.
          alert("This shop was not in your master list. It has been added now. Please edit again to rename if needed.");
          setKnownShops(StorageService.getShops());
          setIsEditingShop(false);
          return;
      }

      // Perform Rename
      StorageService.updateShopAndBills(shopMaster.id, editShopName.trim());
      
      // Update local state
      setKnownShops(StorageService.getShops());
      setViewShop(editShopName.trim()); // Update view to new name
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
          setViewShop(null); // Go back to list
      }
  };

  const handleStartEdit = () => {
      setEditShopName(viewShop || '');
      setIsEditingShop(true);
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4 w-full">
                    <button 
                        onClick={() => setViewShop(null)}
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
                                <p className="text-gray-500">Detailed performance and bill history.</p>
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
                        <button 
                            onClick={handleStartEdit}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Pencil className="w-4 h-4 mr-2" /> Edit Shop
                        </button>
                    )}
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