import React, { useState, useMemo } from 'react';
import { Bill } from '../types';
import { ArrowLeft, Printer, Info } from 'lucide-react';
import { StorageService } from '../services/storage';

interface BillDetailProps {
  bill: Bill;
  onBack: () => void;
}

export const BillDetail: React.FC<BillDetailProps> = ({ bill, onBack }) => {
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Calculate detailed costs
  const detailedItems = useMemo(() => {
    return bill.items.map(item => {
      const mfgCostUnit = StorageService.getManufacturingCost(item.productName);
      const totalMfgCost = mfgCostUnit * item.quantity;
      const profit = item.total - totalMfgCost;
      return {
        ...item,
        mfgCostUnit,
        totalMfgCost,
        profit
      };
    });
  }, [bill.items]);

  const financials = useMemo(() => {
    const totalMfgCost = detailedItems.reduce((sum, item) => sum + item.totalMfgCost, 0);
    const netProfit = bill.totalAmount - totalMfgCost;
    return { totalMfgCost, netProfit };
  }, [detailedItems, bill.totalAmount]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Bill Details</h2>
          </div>
        </div>
        <div className="flex items-center space-x-3">
             <button
                onClick={() => setShowProfitDetails(!showProfitDetails)}
                className={`p-2 rounded-lg transition-colors flex items-center ${showProfitDetails ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Toggle Profit Analysis"
            >
                <Info className="w-5 h-5" />
            </button>
            <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-slate-850 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
            <Printer className="w-4 h-4 mr-2" /> Print Bill
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gray-50/50 print:bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-serif font-bold text-slate-800">{bill.shopName}</h3>
              <p className="text-gray-500 mt-2">Invoice Details</p>
            </div>
            <div className="text-right">
              <h4 className="text-2xl font-bold text-indigo-600">INVOICE</h4>
              <p className="text-gray-600 font-medium mt-1">{bill.invoiceNumber || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">Date: {bill.date}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-8 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b-2 border-slate-100">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Product Name</th>
                {showProfitDetails && (
                     <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-indigo-600">Mfg. Cost</th>
                )}
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Rate</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Qty</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                 {showProfitDetails && (
                     <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right text-green-600">Profit</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detailedItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-4 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-800">{item.productName}</td>
                   {showProfitDetails && (
                     <td className="px-4 py-4 text-sm text-indigo-600 text-right">₹{item.mfgCostUnit.toLocaleString()}</td>
                    )}
                  <td className="px-4 py-4 text-sm text-gray-600 text-right">₹{item.retailPrice.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-800 text-right">₹{item.total.toLocaleString()}</td>
                   {showProfitDetails && (
                     <td className="px-4 py-4 text-sm text-green-600 font-medium text-right">₹{item.profit.toLocaleString()}</td>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Totals */}
        <div className="bg-gray-50 p-8 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-3">
              
              {/* Profit Analysis Section */}
              {showProfitDetails && (
                  <div className="mb-4 pb-4 border-b border-gray-300 space-y-2">
                       <div className="flex justify-between text-gray-600">
                        <span>Total Mfg. Cost</span>
                        <span className="font-medium text-slate-700">₹{financials.totalMfgCost.toLocaleString()}</span>
                      </div>
                       <div className="flex justify-between text-green-700 bg-green-50 p-2 rounded">
                        <span className="font-bold">Net Profit</span>
                        <span className="font-bold">₹{financials.netProfit.toLocaleString()}</span>
                      </div>
                  </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{bill.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Items Count</span>
                <span>{bill.items.length}</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                <span className="font-bold text-lg text-slate-800">Grand Total</span>
                <span className="font-bold text-2xl text-indigo-600">₹{bill.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};