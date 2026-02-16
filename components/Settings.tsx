import React from 'react';
import { StorageService } from '../services/storage';
import { Trash2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const handleClearAll = () => {
    if (confirm('Are you sure? This will delete ALL bills and products permanently.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Settings</h2>
          <p className="text-gray-500">General application configuration.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Data Management</h3>
        <p className="text-sm text-gray-600 mb-4">
            If you need to reset the application to its initial state, you can clear all data. This cannot be undone.
        </p>
        <button
            onClick={handleClearAll}
            className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
        </button>
      </div>
    </div>
  );
};