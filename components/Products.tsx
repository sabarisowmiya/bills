import React, { useState, useEffect } from 'react';
import { ProductMaster } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Trash2, Eye, EyeOff, Pencil, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [showMfgCost, setShowMfgCost] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for adding
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newRetail, setNewRetail] = useState('');

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editRetail, setEditRetail] = useState('');

  useEffect(() => {
    refreshProducts();
  }, []);

  const refreshProducts = () => {
    setProducts(StorageService.getProducts());
  };

  const handleAddProduct = () => {
    if (!newName.trim()) {
        alert("Product Name is required");
        return;
    }
    
    const newProduct: ProductMaster = {
      id: uuidv4(),
      name: newName.trim(),
      manufacturingCost: parseFloat(newCost) || 0,
      defaultRetailPrice: parseFloat(newRetail) || 0,
      defaultMrp: 0, // Keeping defaultMrp as 0 for now as per UI focus on Retail Price
    };

    StorageService.saveProduct(newProduct);
    refreshProducts();
    
    // Reset form
    setNewName('');
    setNewCost('');
    setNewRetail('');
  };

  const handleStartEdit = (product: ProductMaster) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditCost(product.manufacturingCost.toString());
    setEditRetail(product.defaultRetailPrice.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCost('');
    setEditRetail('');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;

    const updatedProduct: ProductMaster = {
        id: editingId,
        name: editName.trim(),
        manufacturingCost: parseFloat(editCost) || 0,
        defaultRetailPrice: parseFloat(editRetail) || 0,
        defaultMrp: 0
    };

    StorageService.saveProduct(updatedProduct);
    refreshProducts();
    handleCancelEdit();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      StorageService.deleteProduct(id);
      refreshProducts();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">Products Management</h2>
                <p className="text-gray-500">Add, edit, or remove products from your catalog.</p>
            </div>
            <button 
                onClick={() => setShowMfgCost(!showMfgCost)}
                className="mt-4 md:mt-0 flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
                {showMfgCost ? <EyeOff className="w-4 h-4 mr-2"/> : <Eye className="w-4 h-4 mr-2"/>}
                {showMfgCost ? 'Hide Costs' : 'Show Costs'}
            </button>
        </div>

        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-indigo-600" />
                Add New Product
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Aloe Vera Gel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mfg. Cost (₹)</label>
                    <input 
                        type="number" 
                        value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                 <div>
                     <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Retail Price (₹)</label>
                    <input 
                        type="number" 
                        value={newRetail}
                        onChange={(e) => setNewRetail(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <button 
                        onClick={handleAddProduct}
                        className="w-full py-2 bg-slate-850 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex justify-center items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                    </button>
                </div>
            </div>
        </div>

        {/* Product List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Mfg. Cost</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Retail Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => {
                            const isEditing = editingId === product.id;
                            return (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={editName} 
                                                onChange={e => setEditName(e.target.value)}
                                                className="w-full px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <span className="font-medium text-slate-800">{product.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         {isEditing ? (
                                            <input 
                                                type="number" 
                                                value={editCost} 
                                                onChange={e => setEditCost(e.target.value)}
                                                className="w-24 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right ml-auto block"
                                            />
                                        ) : (
                                            <span className={showMfgCost ? "text-slate-600" : "text-gray-300 select-none blur-sm"}>
                                                ₹{showMfgCost ? product.manufacturingCost.toLocaleString() : '•••'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         {isEditing ? (
                                            <input 
                                                type="number" 
                                                value={editRetail} 
                                                onChange={e => setEditRetail(e.target.value)}
                                                className="w-24 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right ml-auto block"
                                            />
                                        ) : (
                                            <span className="text-slate-800 font-medium">₹{product.defaultRetailPrice.toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isEditing ? (
                                            <div className="flex justify-center space-x-2">
                                                <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save">
                                                    <Save className="w-5 h-5" />
                                                </button>
                                                <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancel">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center space-x-2">
                                                <button onClick={() => handleStartEdit(product)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                    No products found. Add your first product above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    </div>
  );
};
