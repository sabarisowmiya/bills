import React, { useRef } from 'react';
import { StorageService } from '../services/storage';
import { Trash2, Download, Upload } from 'lucide-react';

export const Settings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearAll = () => {
    if (confirm('Are you sure? This will delete ALL bills, products, and shops permanently. This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = StorageService.getFullExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billgenius_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (confirm('Importing data will OVERWRITE all existing current data. Are you sure you want to proceed?')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          StorageService.importFullData(data);
          alert('Data imported successfully!');
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert('Failed to import data. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Settings</h2>
          <p className="text-gray-500">Manage your application data and preferences.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Backup & Restore Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2 text-indigo-600" />
            Backup & Restore
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Download a copy of all your data (bills, products, shops) to keep it safe or transfer it to another device.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" /> Export Data
            </button>

            <button
              onClick={handleImportClick}
              className="flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" /> Import Data
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 bg-red-50/30">
          <h3 className="text-lg font-medium text-red-700 mb-2 flex items-center">
            <Trash2 className="w-5 h-5 mr-2" />
            Danger Zone
          </h3>
          <p className="text-sm text-red-600/80 mb-4">
            Permanently remove all data from this device. This action cannot be undone.
          </p>
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};