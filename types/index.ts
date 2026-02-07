// Time restriction for products (e.g., alcohol can only be sold during certain hours)
export interface TimeRestriction {
  startHour: number; // 0-23
  endHour: number;   // 0-23
  reason?: string;   // e.g., "ห้ามขายเครื่องดื่มแอลกอฮอล์ 14:00-17:00 และ 00:00-11:00"
}

// Product promotion info
export interface ProductPromotion {
  id: number;
  type: 'discount' | 'bundle' | 'flash' | 'points';
  label: string;      // e.g., "-20%", "ซื้อ 2 แถม 1"
  validUntil?: string;
}

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
  // Optional: Time-based selling restrictions
  timeRestriction?: TimeRestriction;
  // Optional: Active promotions
  promotion?: ProductPromotion;
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

// Promotion Types
export type PromotionType = 'BUY_X_GET_Y' | 'QUANTITY_DISCOUNT' | 'BUNDLE_FREE' | 'NEXT_ITEM_DISCOUNT';

export interface PromotionProductInfo {
  id: number;
  productId: number;
  role: 'trigger' | 'free' | 'discounted';
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
}

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: PromotionType;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  buyQuantity?: number;
  freeQuantity?: number;
  discountPercent?: number;
  discountAmount?: number;
  products: PromotionProductInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionData {
  name: string;
  description?: string;
  type: PromotionType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  buyQuantity?: number;
  freeQuantity?: number;
  discountPercent?: number;
  discountAmount?: number;
  triggerProductIds: number[];
  freeProductIds?: number[];
}

export interface AppliedPromotion {
  promotionId: number;
  name: string;
  type: string;
  discount: number;
  description: string;
}

export interface PromotionCalculationResult {
  originalTotal: number;
  totalDiscount: number;
  finalTotal: number;
  appliedPromotions: AppliedPromotion[];
}

// ============================================
// Inventory Types - ระบบคลังสินค้า
// ============================================

export type InventoryTransactionType =
  | 'RECEIVING'
  | 'ISSUING'
  | 'ADJUSTMENT'
  | 'SALE'
  | 'REFUND';

export interface InventoryTransaction {
  id: number;
  productId: number;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  reference?: string;
  reason?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  product: {
    id: number;
    name: string;
    barcode: string;
    image?: string;
  };
}

export interface StockCount {
  id: number;
  productId: number;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
  isAdjusted: boolean;
  notes?: string;
  countedBy?: string;
  createdAt: string;
  adjustedAt?: string;
  product: {
    id: number;
    name: string;
    barcode: string;
    image?: string;
    stock?: number;
  };
}

export interface StockOverview {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  totalCostValue: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  barcode: string;
  image?: string;
  stock: number;
  minStock: number;
  unit: string;
  categoryName?: string;
}

// Bulk Receiving - รับสินค้าหลายรายการ
export interface ReceivingItem {
  productId: number;
  quantity: number;
}

export interface CreateReceivingData {
  items: ReceivingItem[];
  reference?: string;
  notes?: string;
}

export interface CreateIssuingData {
  productId: number;
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
}

export interface CreateStockCountData {
  productId: number;
  countedQuantity: number;
  notes?: string;
}
