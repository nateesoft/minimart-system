import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from '@/types';
import type { DateLocale } from '@/contexts/SettingsContext';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format options for currency and date
 */
export interface FormatOptions {
  locale?: DateLocale;
}

/**
 * Format currency to Thai Baht with locale support
 */
export function formatCurrency(amount: number, options: FormatOptions = {}): string {
  const { locale = 'th-TH' } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date with locale support
 */
export function formatDate(date: Date | string, options: FormatOptions = {}): string {
  const { locale = 'th-TH' } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format short date with locale support
 */
export function formatDateShort(date: Date | string, options: FormatOptions = {}): string {
  const { locale = 'th-TH' } = options;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Generate transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TXN${timestamp}${random}`;
}

/**
 * Check if product is low stock
 */
export function isLowStock(product: Product, threshold: number = 10): boolean {
  return product.stock > 0 && product.stock <= threshold;
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(product: Product): boolean {
  return product.stock === 0;
}

/**
 * Calculate discount
 */
export function calculateDiscount(
  subtotal: number,
  discountPercent: number = 0
): number {
  return (subtotal * discountPercent) / 100;
}

/**
 * Play beep sound for barcode scan
 */
export function playBeepSound(): void {
  if (typeof window !== 'undefined') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }
}

/**
 * Validate barcode format
 */
export function isValidBarcode(barcode: string): boolean {
  // Check if barcode is 13 digits (EAN-13 format)
  return /^\d{13}$/.test(barcode);
}

/**
 * Get stock status badge color
 */
export function getStockStatusColor(stock: number): string {
  if (stock === 0) return 'bg-red-500';
  if (stock <= 10) return 'bg-orange-500';
  return 'bg-green-500';
}

/**
 * Get stock status key for translation
 */
export function getStockStatusKey(stock: number): string {
  if (stock === 0) return 'pos.product.outOfStock';
  if (stock <= 10) return 'pos.product.lowStock';
  return 'pos.product.available';
}

/**
 * Get stock status text (for backward compatibility)
 */
export function getStockStatusText(stock: number): string {
  if (stock === 0) return 'หมด';
  if (stock <= 10) return 'เหลือน้อย';
  return 'พร้อมขาย';
}

/**
 * Check if product is within sellable time
 * Returns true if product CAN be sold now
 */
export function isWithinSellableTime(product: Product): boolean {
  if (!product.timeRestriction) return true;

  const now = new Date();
  const currentHour = now.getHours();
  const { startHour, endHour } = product.timeRestriction;

  // Handle cases where end hour is less than start hour (crosses midnight)
  if (endHour < startHour) {
    // e.g., startHour=22, endHour=6 means 22:00 to 06:00
    return currentHour >= startHour || currentHour < endHour;
  }

  // Normal case: start < end
  return currentHour >= startHour && currentHour < endHour;
}

/**
 * Check if product is time-restricted (cannot be sold now)
 */
export function isTimeRestricted(product: Product): boolean {
  return !isWithinSellableTime(product);
}

/**
 * Get time restriction message
 */
export function getTimeRestrictionMessage(product: Product): string | null {
  if (!product.timeRestriction) return null;

  const { startHour, endHour, reason } = product.timeRestriction;
  if (reason) return reason;

  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;
  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

/**
 * Check if product has active promotion
 */
export function hasActivePromotion(product: Product): boolean {
  return !!product.promotion;
}

/**
 * Get promotion badge color based on type
 */
export function getPromotionColor(type: string): string {
  switch (type) {
    case 'discount': return 'from-green-500 to-emerald-500';
    case 'bundle': return 'from-orange-500 to-red-500';
    case 'flash': return 'from-purple-500 to-pink-500';
    case 'points': return 'from-blue-500 to-cyan-500';
    default: return 'from-gray-500 to-gray-600';
  }
}

/**
 * Check if product can be added to cart
 */
export function canAddToCart(product: Product): { allowed: boolean; reasonKey?: string; reason?: string } {
  if (isOutOfStock(product)) {
    return { allowed: false, reasonKey: 'pos.product.outOfStock', reason: 'สินค้าหมด' };
  }

  if (isTimeRestricted(product)) {
    const message = getTimeRestrictionMessage(product);
    return { allowed: false, reasonKey: 'pos.timeRestricted', reason: message || 'ไม่อยู่ในเวลาที่ขายได้' };
  }

  return { allowed: true };
}
