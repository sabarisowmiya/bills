import { Bill, ProductMaster, ShopMaster } from '../types';

const BILLS_KEY = 'bg_bills';
const PRODUCTS_KEY = 'bg_products';
const SHOPS_KEY = 'bg_shops';

// Initial data cleared as per user request to manage their own specific products
const INITIAL_PRODUCTS: ProductMaster[] = [
    // Leaving one example that can be deleted, to show how it looks
    { id: '1', name: 'Example Product', manufacturingCost: 0, defaultMrp: 0, defaultRetailPrice: 0 },
];

export const StorageService = {
  getBills: (): Bill[] => {
    const data = localStorage.getItem(BILLS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveBill: (bill: Bill) => {
    const bills = StorageService.getBills();
    const existingIndex = bills.findIndex(b => b.id === bill.id);
    if (existingIndex >= 0) {
      bills[existingIndex] = bill;
    } else {
      bills.push(bill);
    }
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    
    // Auto-save shop if it doesn't exist in master list
    const shops = StorageService.getShops();
    if (!shops.find(s => s.name.toLowerCase() === bill.shopName.toLowerCase())) {
        StorageService.saveShop({ id: Date.now().toString(), name: bill.shopName });
    }
  },

  deleteBill: (id: string) => {
    const bills = StorageService.getBills().filter(b => b.id !== id);
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  },

  getProducts: (): ProductMaster[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },

  saveProduct: (product: ProductMaster) => {
    const products = StorageService.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  deleteProduct: (id: string) => {
    const products = StorageService.getProducts().filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  getShops: (): ShopMaster[] => {
    const data = localStorage.getItem(SHOPS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveShop: (shop: ShopMaster) => {
    const shops = StorageService.getShops();
    const existingIndex = shops.findIndex(s => s.id === shop.id);
    if (existingIndex >= 0) {
      shops[existingIndex] = shop;
    } else {
      shops.push(shop);
    }
    localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  },

  deleteShop: (id: string) => {
    const shops = StorageService.getShops().filter(s => s.id !== id);
    localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  },

  getManufacturingCost: (productName: string): number => {
    const products = StorageService.getProducts();
    // Simple case-insensitive match
    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    return product ? product.manufacturingCost : 0;
  }
};