import React, { useState, useEffect } from 'react';
import { Bill, BillItem, ProductMaster, ShopMaster } from '../types';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storage';

interface BillEditorProps {
  initialData?: Partial<Bill>;
  onSave: (bill: Bill) => void;
  onCancel: () => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({ initialData, onSave, onCancel }) => {
  const [shopName, setShopName] = useState(initialData?.shopName || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<BillItem[]>(initialData?.items || []);
  
  // Data for Autocomplete/Validation
  const [knownProducts, setKnownProducts] = useState<ProductMaster[]>([]);
  const [knownShops, setKnownShops] = useState<ShopMaster[]>([]);

  // Validation States
  const [shopError, setShopError] = useState(false);

  useEffect(() => {
    setKnownProducts(StorageService.getProducts());
    setKnownShops(StorageService.getShops());
  }, []);

  // Validate Shop Name whenever it changes
  useEffect(() => {
    if (shopName && knownShops.length > 0) {
        const exists = knownShops.some(s => s.name.toLowerCase() === shopName.toLowerCase());
        setShopError(!exists);
    } else {
        setShopError(false);
    }
  }, [shopName, knownShops]);
  
  // Recalculate total whenever items change
  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: uuidv4(),
        productName: '', // Empty initially, user must select
        retailPrice: 0,
        quantity: 1,
        total: 0,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof BillItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      let updatedItem = { ...item, [field]: value };
      
      // Auto-fetch price if product name changes (via dropdown)
      if (field === 'productName') {
        const product = knownProducts.find(p => p.name === value);
        if (product) {
            updatedItem.retailPrice = product.defaultRetailPrice;
        }
      }

      // Recalculate total if quantity or price changes
      const currentPrice = field === 'retailPrice' ? value : updatedItem.retailPrice;
      const currentQty = field === 'quantity' ? value : updatedItem.quantity;
      updatedItem.total = currentPrice * currentQty;
      
      return updatedItem;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    // 1. Validate Shop
    if (!shopName.trim()) {
      alert('Shop Name is required');
      return;
    }
    if (shopError) {
        alert('Please select a valid Shop Name from the Shops tab list.');
        return;
    }

    // 2. Validate Items
    if (items.length === 0) {
      alert('At least one product is required');
      return;
    }

    // Check for invalid products
    const invalidItems = items.filter(item => !knownProducts.some(kp => kp.name === item.productName));
    if (invalidItems.length > 0) {
        alert(`Some products are invalid (e.g., "${invalidItems[0].productName}"). Please map them to known products.`);
        return;
    }

    const bill: Bill = {
      id: initialData?.id || uuidv4(),
      shopName,
      invoiceNumber,
      date,
      items,
      totalAmount,
      createdAt: Date.now(),
    };
    onSave(bill);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Datalist for Shop only - Products use Select */}
        <datalist id="shop-list">
            {knownShops.map(shop => (
                <option key={shop.id} value={shop.name} />
            ))}
        </datalist>

      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-serif text-lg font-bold text-slate-800">
          {initialData?.id ? 'Edit Bill Details' : 'New Bill Entry'}
        </h3>
        <span className="text-sm text-gray-500">Review and validate data</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name <span className="text-red-500">*</span></label>
            <div className="relative">
                <input
                type="text"
                list="shop-list"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none ${shopError ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-indigo-500'}`}
                placeholder="Enter or select Shop Name"
                autoComplete="off"
                />
                {shopError && (
                    <div className="absolute right-3 top-2.5 text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                )}
            </div>
            {shopError && <p className="text-xs text-red-500 mt-1">Shop not found. Add it in 'Shops' tab first.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="#INV-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Product List */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Products</label>
                <button
                    onClick={handleAddItem}
                    className="text-sm flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                </button>
            </div>
          
          <div className="border border-gray-200 rounded-lg overflow-x-auto min-h-[200px]">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left w-1/3">Product Name</th>
                  <th className="px-4 py-2 text-right w-24">Rate (₹)</th>
                  <th className="px-4 py-2 text-center w-20">Qty</th>
                  <th className="px-4 py-2 text-right w-28">Total</th>
                  <th className="px-4 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => {
                  const isInvalid = item.productName && !knownProducts.some(p => p.name === item.productName);
                  
                  return (
                  <tr key={item.id} className={isInvalid ? "bg-red-50" : ""}>
                    <td className="px-4 py-2">
                      {/* Strictly enforce product selection via Select Dropdown */}
                      <div className="relative">
                          <select
                            value={knownProducts.some(p => p.name === item.productName) ? item.productName : ""}
                            onChange={(e) => handleUpdateItem(item.id, 'productName', e.target.value)}
                            className={`w-full bg-transparent outline-none border-b py-1 focus:border-indigo-500 ${isInvalid ? 'border-red-500 text-red-700 font-semibold' : 'border-transparent'}`}
                          >
                             {/* If the current value is invalid (from AI) and not empty, show it as a disabled option so user knows what AI found */}
                             {isInvalid && item.productName && (
                                 <option value="" disabled className="text-red-500 bg-red-100">
                                     ⚠️ Unknown: {item.productName}
                                 </option>
                             )}
                             <option value="" disabled={!!item.productName && !isInvalid}>Select Product...</option>
                             {knownProducts.map(p => (
                                 <option key={p.id} value={p.name}>{p.name}</option>
                             ))}
                          </select>
                          {isInvalid && item.productName && (
                              <p className="text-[10px] text-red-500 absolute -bottom-3 left-0">
                                  Product not in list. Please map to known product.
                              </p>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.retailPrice}
                        onChange={(e) => handleUpdateItem(item.id, 'retailPrice', parseFloat(e.target.value))}
                        className="w-full text-right bg-transparent outline-none focus:border-b focus:border-indigo-500 font-medium text-gray-900"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        className="w-full text-center bg-transparent outline-none focus:border-b focus:border-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-800">
                      ₹{item.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {items.length === 0 && (
                    <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 text-sm italic">
                            No items. Add items manually or upload a bill image.
                        </td>
                    </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-bold text-slate-800">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm uppercase">Total Amount</td>
                  <td className="px-4 py-3 text-right text-lg">₹{totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-slate-850 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={shopError}
          >
            <Save className="w-4 h-4 mr-2" /> Save & Analyze
          </button>
        </div>
      </div>
    </div>
  );
};