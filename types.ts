export interface ProductMaster {
  id: string;
  name: string;
  manufacturingCost: number;
  defaultMrp: number;
  defaultRetailPrice: number;
}

export interface ShopMaster {
  id: string;
  name: string;
  location?: string;
}

export interface BillItem {
  id: string;
  productName: string;
  mrp?: number; // Made optional as it's removed from entry
  retailPrice: number; // Price given to shop
  quantity: number;
  total: number;
}

export interface Bill {
  id: string;
  shopName: string;
  invoiceNumber: string;
  date: string; // ISO String YYYY-MM-DD
  items: BillItem[];
  totalAmount: number;
  createdAt: number;
}

export interface ShopStats {
  shopName: string;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number; // For this app, simplified as Revenue - Manufacturing Cost
  billCount: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  BILLS = 'BILLS',
  PRODUCTS = 'PRODUCTS',
  SHOPS = 'SHOPS',
  SETTINGS = 'SETTINGS',
}