import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from '@/types';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to Thai Baht
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to Thai format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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
 * Get stock status text
 */
export function getStockStatusText(stock: number): string {
  if (stock === 0) return 'หมด';
  if (stock <= 10) return 'เหลือน้อย';
  return 'พร้อมขาย';
}
