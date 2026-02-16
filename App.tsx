import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillUpload } from './components/BillUpload';
import { BillEditor } from './components/BillEditor';
import { Settings } from './components/Settings';
import { Products } from './components/Products';
import { Shops } from './components/Shops';
import { StorageService } from './services/storage';
import { AppView, Bill } from './types';
import { Trash2 } from 'lucide-react';
import { BillDetail } from './components/BillDetail';
import { Login } from './components/Login';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App State
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [bills, setBills] = useState<Bill[]>([]);
  const [pendingBillData, setPendingBillData] = useState<Partial<Bill> | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage for persistence
    const savedAuth = sessionStorage.getItem('bg_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Load data from API
    const loadData = async () => {
      try {
        const billsData = await StorageService.getBills();
        setBills(billsData);
      } catch (error) {
        console.error('Failed to load bills:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogin = (status: boolean) => {
    setIsAuthenticated(status);
    if (status) {
      sessionStorage.setItem('bg_auth', 'true');
    } else {
      sessionStorage.removeItem('bg_auth');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('bg_auth');
    setCurrentView(AppView.DASHBOARD);
  };

  const handleExtractionComplete = (data: Partial<Bill>) => {
    setPendingBillData(data);
  };

  const handleManualEntry = () => {
    setPendingBillData({});
  };

  const handleSaveBill = async (bill: Bill) => {
    try {
      await StorageService.saveBill(bill);
      const updatedBills = await StorageService.getBills();
      setBills(updatedBills);
      setPendingBillData(null);
      setCurrentView(AppView.DASHBOARD);
    } catch (error) {
      console.error('Failed to save bill:', error);
      alert('Failed to save bill. Please try again.');
    }
  };

  const handleDeleteBill = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this bill record?')) {
      try {
        await StorageService.deleteBill(id);
        const updatedBills = await StorageService.getBills();
        setBills(updatedBills);
        // If deleted bill was viewed, close view
        if (selectedBill?.id === id) setSelectedBill(null);
      } catch (error) {
        console.error('Failed to delete bill:', error);
        alert('Failed to delete bill. Please try again.');
      }
    }
  }

  // --- Views ---

  // 1. Upload View Logic (Wraps Upload and Editor)
  const renderUploadView = () => {
    if (pendingBillData) {
      return (
        <BillEditor
          initialData={pendingBillData}
          onSave={handleSaveBill}
          onCancel={() => setPendingBillData(null)}
        />
      );
    }
    return (
      <BillUpload
        onExtractionComplete={handleExtractionComplete}
        onManualEntry={handleManualEntry}
      />
    );
  };

  // 2. Bills History List
  const renderBillHistory = () => {
    if (selectedBill) {
      return <BillDetail bill={selectedBill} onBack={() => setSelectedBill(null)} />;
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-slate-800">Bill History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(bill => (
                <tr
                  key={bill.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedBill(bill)}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{bill.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{bill.invoiceNumber || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{bill.shopName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">₹{bill.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={(e) => handleDeleteBill(bill.id, e)} className="text-gray-400 hover:text-red-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No bills recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentView={currentView} onChangeView={(view) => {
      // Handle Logout check if view is technically a logout action (optional, but let's keep it simple)
      // If we added a logout button in sidebar, we would handle it here or pass the handleLogout prop
      if (view === AppView.LOGOUT) {
        handleLogout();
        return;
      }
      setCurrentView(view);
      setPendingBillData(null);
      setSelectedBill(null);
    }}>
      {currentView === AppView.DASHBOARD && <Dashboard bills={bills} />}
      {currentView === AppView.UPLOAD && renderUploadView()}
      {currentView === AppView.BILLS && renderBillHistory()}
      {currentView === AppView.PRODUCTS && <Products />}
      {currentView === AppView.SHOPS && <Shops bills={bills} />}
      {/* Pass handleLogout to Settings if needed later, or just keep it here */}
      {currentView === AppView.SETTINGS && <Settings />}
    </Layout>
  );
};

export default App;