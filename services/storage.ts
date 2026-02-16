import { Bill, ProductMaster, ShopMaster } from '../types';

// API base path
const API_BASE = '/.netlify/functions';

// Initial data for first-time setup
const INITIAL_PRODUCTS: ProductMaster[] = [
  { id: '1', name: 'Example Product', manufacturingCost: 0, defaultMrp: 0, defaultRetailPrice: 0 },
];

export const StorageService = {
  // ===== BILLS =====
  getBills: async (): Promise<Bill[]> => {
    try {
      const response = await fetch(`${API_BASE}/bills`);
      if (!response.ok) throw new Error('Failed to fetch bills');
      return await response.json();
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  },

  saveBill: async (bill: Bill): Promise<void> => {
    try {
      const bills = await StorageService.getBills();
      const existingIndex = bills.findIndex(b => b.id === bill.id);

      if (existingIndex >= 0) {
        // Update existing bill
        await fetch(`${API_BASE}/bills`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill)
        });
      } else {
        // Add new bill
        await fetch(`${API_BASE}/bills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill)
        });
      }

      // Auto-save shop if it doesn't exist
      const shops = await StorageService.getShops();
      if (!shops.find(s => s.name.toLowerCase() === bill.shopName.toLowerCase())) {
        await StorageService.saveShop({ id: Date.now().toString(), name: bill.shopName });
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    }
  },

  deleteBill: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/bills`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id) })
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },

  // ===== PRODUCTS =====
  getProducts: async (): Promise<ProductMaster[]> => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const products = await response.json();

      // Initialize with example product if empty
      if (products.length === 0) {
        for (const product of INITIAL_PRODUCTS) {
          await StorageService.saveProduct(product);
        }
        return INITIAL_PRODUCTS;
      }

      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return INITIAL_PRODUCTS;
    }
  },

  saveProduct: async (product: ProductMaster): Promise<void> => {
    try {
      const products = await StorageService.getProducts();
      const existingIndex = products.findIndex(p => p.id === product.id);

      if (existingIndex >= 0) {
        await fetch(`${API_BASE}/products`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      } else {
        await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id) })
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // ===== SHOPS =====
  getShops: async (): Promise<ShopMaster[]> => {
    try {
      const response = await fetch(`${API_BASE}/shops`);
      if (!response.ok) throw new Error('Failed to fetch shops');
      return await response.json();
    } catch (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
  },

  saveShop: async (shop: ShopMaster): Promise<void> => {
    try {
      const shops = await StorageService.getShops();
      const existingIndex = shops.findIndex(s => s.id === shop.id);

      if (existingIndex >= 0) {
        await fetch(`${API_BASE}/shops`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shop)
        });
      } else {
        await fetch(`${API_BASE}/shops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shop)
        });
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      throw error;
    }
  },

  updateShopAndBills: async (shopId: string, newName: string): Promise<void> => {
    try {
      const shops = await StorageService.getShops();
      const shopIndex = shops.findIndex(s => String(s.id) === String(shopId));

      if (shopIndex === -1) return;

      const oldName = shops[shopIndex].name;

      // 1. Update Shop Master
      shops[shopIndex].name = newName;
      await StorageService.saveShop(shops[shopIndex]);

      // 2. Update all Bills
      const bills = await StorageService.getBills();
      for (const bill of bills) {
        if (bill.shopName === oldName) {
          bill.shopName = newName;
          await StorageService.saveBill(bill);
        }
      }
    } catch (error) {
      console.error('Error updating shop and bills:', error);
      throw error;
    }
  },

  deleteShop: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/shops`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(id) })
      });
    } catch (error) {
      console.error('Error deleting shop:', error);
      throw error;
    }
  },

  // ===== UTILITY =====
  getManufacturingCost: async (productName: string): Promise<number> => {
    const products = await StorageService.getProducts();
    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    return product ? product.manufacturingCost : 0;
  },

  getFullExport: async () => {
    return {
      bills: await StorageService.getBills(),
      products: await StorageService.getProducts(),
      shops: await StorageService.getShops(),
      exportDate: new Date().toISOString()
    };
  },

  importFullData: async (data: any): Promise<void> => {
    if (!data || !data.bills || !data.products || !data.shops) {
      throw new Error('Invalid data format');
    }

    // Import all data
    for (const bill of data.bills) {
      await StorageService.saveBill(bill);
    }
    for (const product of data.products) {
      await StorageService.saveProduct(product);
    }
    for (const shop of data.shops) {
      await StorageService.saveShop(shop);
    }
  }
};