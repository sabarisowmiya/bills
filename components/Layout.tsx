import React from 'react';
import { LayoutDashboard, Upload, Receipt, Settings, PieChart, Package, Store } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Analytics', icon: LayoutDashboard },
    { view: AppView.UPLOAD, label: 'New Bill', icon: Upload },
    { view: AppView.BILLS, label: 'History', icon: Receipt },
    { view: AppView.PRODUCTS, label: 'Products', icon: Package },
    { view: AppView.SHOPS, label: 'Shops', icon: Store },
    { view: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-800 font-sans">
      {/* Sidebar - Mobile Responsive: Sticky bottom on mobile, side on desktop */}
      <aside className="fixed bottom-0 z-50 w-full bg-white border-t border-gray-200 md:relative md:w-64 md:border-t-0 md:border-r md:flex md:flex-col md:h-screen">
        <div className="hidden md:flex items-center justify-center h-16 border-b border-gray-200 bg-slate-850 text-white">
          <PieChart className="w-6 h-6 mr-2 text-indigo-400" />
          <span className="font-serif text-xl font-bold tracking-wide">BillGenius</span>
        </div>

        <nav className="flex justify-around md:flex-col md:justify-start md:p-4 md:space-y-2 h-16 md:h-auto overflow-x-auto md:overflow-visible">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onChangeView(item.view)}
              className={`flex flex-col md:flex-row items-center flex-shrink-0 md:px-4 md:py-3 rounded-lg transition-colors md:w-full p-2 md:p-3 ${
                currentView === item.view
                  ? 'text-indigo-600 md:bg-indigo-50'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-6 h-6 md:w-5 md:h-5 md:mr-3" />
              <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen pb-20 md:pb-0">
         <div className="md:hidden flex items-center justify-between h-16 px-4 bg-slate-850 text-white shadow-sm sticky top-0 z-40">
             <div className="flex items-center">
                <PieChart className="w-6 h-6 mr-2 text-indigo-400" />
                <span className="font-serif text-lg font-bold">BillGenius</span>
             </div>
         </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};