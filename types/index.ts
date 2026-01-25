// Product Types
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  barcode: string;
  stock: number;
  image: string;
  unit: string;
}

// Cart Types
export interface CartItem extends Product {
  quantity: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  icon: string;
}

// Payment Types
export type PaymentMethod = 'cash' | 'card' | 'qr';

export interface Payment {
  method: PaymentMethod;
  amount: number;
  change?: number;
}

// Transaction Types
export interface Transaction {
  id: string;
  timestamp: Date;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment: Payment;
}

// Sales Report Types
export interface DailySales {
  date: string;
  totalTransactions: number;
  totalRevenue: number;
  totalItems: number;
}
