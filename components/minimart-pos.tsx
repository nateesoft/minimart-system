'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  ScanLine,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  X,
  AlertCircle,
  Home,
  CheckCircle2,
  Sparkles,
  Receipt,
  History,
  ChevronLeft,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftOpen,
  PanelLeftClose,
  Tag,
  Percent,
  Gift,
  Clock,
  Zap,
  RotateCcw,
  AlertTriangle,
  Package
} from 'lucide-react';
import Link from 'next/link';
import type { Product, CartItem, Category, AppliedPromotion } from '@/types';
import {
  formatCurrency,
  formatDate,
  playBeepSound,
  isLowStock,
  isOutOfStock,
  isTimeRestricted,
  getTimeRestrictionMessage,
  hasActivePromotion,
  getPromotionColor,
  canAddToCart
} from '@/lib/utils';
import {
  fetchCategories,
  fetchProducts,
  fetchProductByBarcode,
  createTransaction,
  fetchTransactions,
  refundTransaction,
  calculateCartPromotions,
  login,
  getAuthToken,
  ApiError,
  type Transaction,
} from '@/lib/api';

// Payment success data type
interface PaymentSuccessData {
  total: number;
  received: number;
  change: number;
  paymentMethod: 'cash' | 'card';
  items: number;
}

// Toast notification type
interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

// Toast Notification Component
function ToastContainer({ toasts, onRemove }: { toasts: ToastNotification[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null;

  const getToastStyles = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
          icon: <CheckCircle2 className="text-white" size={24} />,
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: <AlertCircle className="text-white" size={24} />,
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: <AlertCircle className="text-white" size={24} />,
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`${styles.bg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[320px] max-w-md animate-[slideInRight_0.3s_ease-out]`}
          >
            <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
            <div className="flex-1">
              <p className="font-bold text-sm">{toast.title}</p>
              {toast.message && <p className="text-xs opacity-90 mt-1">{toast.message}</p>}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const CART_STORAGE_KEY = 'minimart_cart';

// Refund Modal Component (defined outside to prevent re-creation on every render)
interface RefundModalProps {
  transaction: Transaction;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isRefunding: boolean;
}

function RefundModalComponent({
  transaction,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  isRefunding,
}: RefundModalProps) {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="mr-3" size={28} />
              <div>
                <h2 className="text-xl font-bold">ยืนยันการคืนเงิน</h2>
                <p className="text-orange-100 text-sm">Refund Confirmation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">เลขที่รายการ:</span>
              <span className="font-bold text-gray-800">#{transaction.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">วันที่:</span>
              <span className="text-gray-800">{formatDateTime(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">จำนวนสินค้า:</span>
              <span className="text-gray-800">{transaction.items?.length || 0} รายการ</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-700">ยอดคืนเงิน:</span>
              <span className="font-bold text-xl text-orange-600">{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-orange-800 font-medium">คำเตือน</p>
                <p className="text-xs text-orange-700 mt-1">
                  การคืนเงินจะทำให้สถานะรายการเปลี่ยนเป็น &quot;คืนเงิน&quot; และสต็อกสินค้าจะถูกคืนกลับ ไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              เหตุผลการคืนเงิน (ไม่บังคับ)
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="ระบุเหตุผล เช่น สินค้าชำรุด, ลูกค้าเปลี่ยนใจ..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isRefunding}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={isRefunding}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                isRefunding
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isRefunding ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <RotateCcw size={18} />
                  ยืนยันคืนเงิน
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to load cart from localStorage
function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (err) {
    console.error('Failed to load cart from localStorage:', err);
  }
  return [];
}

export default function MinimartPOS() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccessData | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // API integration state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: 'ทั้งหมด', icon: '🏪' }]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // History modal state
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyMeta, setHistoryMeta] = useState<{ total: number; totalPages: number }>({ total: 0, totalPages: 0 });

  // Recent paid transactions (shown on main page)
  const [recentPaidTransactions, setRecentPaidTransactions] = useState<Transaction[]>([]);

  // Right panel state (collapsible) - default collapsed
  const [isPaidPanelOpen, setIsPaidPanelOpen] = useState<boolean>(false);

  // Left panel state (promotions) - default collapsed
  const [isPromoPanelOpen, setIsPromoPanelOpen] = useState<boolean>(false);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundingTransaction, setRefundingTransaction] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const toastIdRef = useRef<number>(0);

  // Promotion calculation state
  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
  const [promotionDiscount, setPromotionDiscount] = useState<number>(0);

  // Show toast notification
  const showToast = (type: ToastNotification['type'], title: string, message?: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  // Remove toast
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sample promotions data
  const promotions = [
    {
      id: 1,
      title: 'ซื้อ 2 แถม 1',
      description: 'น้ำดื่มทุกชนิด ซื้อ 2 ขวด แถมฟรี 1 ขวด',
      type: 'bundle',
      discount: 'แถมฟรี',
      validUntil: '28 ก.พ. 2026',
      color: 'from-orange-500 to-red-500',
      icon: Gift,
    },
    {
      id: 2,
      title: 'ลด 20%',
      description: 'ขนมขบเคี้ยวทุกชนิด ลดราคา 20%',
      type: 'percent',
      discount: '-20%',
      validUntil: '15 ก.พ. 2026',
      color: 'from-green-500 to-emerald-500',
      icon: Percent,
    },
    {
      id: 3,
      title: 'Flash Sale',
      description: 'บะหมี่กึ่งสำเร็จรูป ลดเหลือ 6 บาท',
      type: 'flash',
      discount: '฿6',
      validUntil: 'วันนี้เท่านั้น',
      color: 'from-purple-500 to-pink-500',
      icon: Zap,
    },
    {
      id: 4,
      title: 'สะสมแต้ม x2',
      description: 'สินค้าหมวดของใช้ รับแต้มสะสม 2 เท่า',
      type: 'points',
      discount: 'x2 แต้ม',
      validUntil: '31 ก.พ. 2026',
      color: 'from-blue-500 to-cyan-500',
      icon: Tag,
    },
    {
      id: 5,
      title: 'Happy Hour',
      description: 'เครื่องดื่มเย็น ลด 15% เวลา 14:00-16:00',
      type: 'time',
      discount: '-15%',
      validUntil: 'ทุกวัน',
      color: 'from-amber-500 to-yellow-500',
      icon: Clock,
    },
  ];

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    setCart(savedCart);
    setIsCartLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cart, isCartLoaded]);

  // Auto-login and load data from API
  useEffect(() => {
    async function initializeApp() {
      setIsLoading(true);
      setError(null);
      try {
        if (!getAuthToken()) {
          await login('cashier', 'pos1234');
        }
        const [cats, prods] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);

        // Load recent paid transactions
        await loadRecentPaidTransactions();
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      } finally {
        setIsLoading(false);
      }
    }
    initializeApp();
  }, []);

  // Reload products after transaction
  const reloadProducts = async () => {
    try {
      const prods = await fetchProducts();
      setProducts(prods);
    } catch (err) {
      console.error('Failed to reload products:', err);
    }
  };

  // Load transaction history
  const loadHistory = async (page: number = 1) => {
    setHistoryLoading(true);
    try {
      const result = await fetchTransactions({ page, limit: 10 });
      setTransactions(result.data);
      setHistoryMeta({ total: result.meta.total, totalPages: result.meta.totalPages });
      setHistoryPage(page);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load recent paid transactions for main page display
  const loadRecentPaidTransactions = async () => {
    try {
      const result = await fetchTransactions({ page: 1, limit: 5 });
      setRecentPaidTransactions(result.data);
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
    }
  };

  // Open history modal
  const openHistory = () => {
    setShowHistory(true);
    loadHistory(1);
  };

  // Open refund modal
  const openRefundModal = (transaction: Transaction) => {
    setRefundingTransaction(transaction);
    setRefundReason('');
    setShowRefundModal(true);
  };

  // Close refund modal
  const closeRefundModal = () => {
    setShowRefundModal(false);
    setRefundingTransaction(null);
    setRefundReason('');
  };

  // Handle refund
  const handleRefund = async () => {
    if (!refundingTransaction || isRefunding) return;

    setIsRefunding(true);
    try {
      await refundTransaction(refundingTransaction.id, refundReason || undefined);

      // Reload data
      await Promise.all([
        loadHistory(historyPage),
        loadRecentPaidTransactions(),
        reloadProducts(),
      ]);

      closeRefundModal();
      showToast('success', 'คืนเงินสำเร็จ', `รายการ #${refundingTransaction.id} ได้รับการคืนเงินเรียบร้อยแล้ว`);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'เกิดข้อผิดพลาดในการคืนเงิน';
      showToast('error', 'คืนเงินไม่สำเร็จ', message);
    } finally {
      setIsRefunding(false);
    }
  };

  // Auto-focus barcode input with F2
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F2' && barcodeInputRef.current) {
        e.preventDefault();
        barcodeInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Calculate promotions when cart changes
  useEffect(() => {
    const calculatePromotions = async () => {
      if (cart.length === 0) {
        setAppliedPromotions([]);
        setPromotionDiscount(0);
        return;
      }

      try {
        const items = cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        }));
        const result = await calculateCartPromotions(items);
        setAppliedPromotions(result.appliedPromotions);
        setPromotionDiscount(result.totalDiscount);
      } catch (err) {
        // Silently fail - promotions are optional
        console.error('Failed to calculate promotions:', err);
        setAppliedPromotions([]);
        setPromotionDiscount(0);
      }
    };

    calculatePromotions();
  }, [cart]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.barcode.includes(searchTerm);
    return matchCategory && matchSearch;
  });

  // Scan barcode
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    try {
      const product = await fetchProductByBarcode(barcodeInput);
      addToCart(product);
      playBeepSound();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        alert('❌ ไม่พบสินค้า! กรุณาตรวจสอบบาร์โค้ดอีกครั้ง');
      } else {
        alert('❌ เกิดข้อผิดพลาดในการค้นหาสินค้า');
      }
    } finally {
      setBarcodeInput('');
    }
  };

  // Add to cart
  const addToCart = (product: Product) => {
    // Check if product can be added (stock & time restrictions)
    const { allowed, reason } = canAddToCart(product);
    if (!allowed) {
      showToast('error', 'ไม่สามารถเพิ่มสินค้าได้', reason);
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showToast('error', 'สต็อกไม่เพียงพอ', `คงเหลือ ${product.stock} ${product.unit}`);
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Increase quantity
  const increaseQuantity = (id: number) => {
    const item = cart.find(item => item.id === id);
    if (item && item.quantity >= item.stock) {
      alert(`❌ สินค้าคงเหลือไม่เพียงพอ (คงเหลือ ${item.stock} ${item.unit})`);
      return;
    }
    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Decrease quantity
  const decreaseQuantity = (id: number) => {
    const item = cart.find(item => item.id === id);
    if (item && item.quantity === 1) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      ));
    }
  };

  // Remove from cart
  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = promotionDiscount;
  const total = subtotal - discount;
  const paymentValue = parseFloat(paymentAmount) || 0;
  const change = paymentValue - total;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setShowCheckout(false);
    setPaymentAmount('');
  };

  // Handle payment success
  const handlePaymentSuccess = async (method: 'cash' | 'card') => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Submit transaction to backend
      await createTransaction({
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        discount: discount,
        payment: {
          method: method,
          amount: method === 'cash' ? paymentValue : total,
        },
      });

      // Show success UI
      const successData: PaymentSuccessData = {
        total,
        received: method === 'cash' ? paymentValue : total,
        change: method === 'cash' ? change : 0,
        paymentMethod: method,
        items: totalItems,
      };
      setPaymentSuccessData(successData);
      setShowCheckout(false);
      setShowSuccessModal(true);

      // Clear cart immediately after successful payment
      setCart([]);
      setPaymentAmount('');

      // Reload products to get updated stock
      await reloadProducts();

      // Reload recent paid transactions
      await loadRecentPaidTransactions();

      // Auto close success modal after 5 seconds (cart already cleared)
      setTimeout(() => {
        setShowSuccessModal(false);
        setPaymentSuccessData(null);
      }, 5000);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'เกิดข้อผิดพลาดในการบันทึกรายการ';
      alert(`❌ ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close success modal manually (cart already cleared after payment)
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setPaymentSuccessData(null);
  };

  // Quick amounts
  const quickAmounts = [100, 500, 1000];

  // Checkout Modal
  const CheckoutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">ชำระเงิน</h2>
              <p className="text-blue-100 text-sm mt-1">กรุณาระบุจำนวนเงินที่รับ</p>
            </div>
            <button 
              onClick={() => {
                setShowCheckout(false);
                setPaymentAmount('');
              }} 
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm mb-1">ยอดชำระทั้งหมด</p>
              <p className="text-4xl font-bold text-indigo-600">{formatCurrency(total)}</p>
            </div>
            
            <div className="border-t border-gray-300 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ยอดรวม</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>ส่วนลด</span>
                  <span className="font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">จำนวนสินค้า</span>
                <span className="font-semibold">{totalItems} ชิ้น</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              จำนวนเงินที่รับ (บาท)
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-right"
              autoFocus
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">จำนวนเงินด่วน</p>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setPaymentAmount(prev => {
                    const currentValue = parseFloat(prev) || 0;
                    return (currentValue + amount).toString();
                  })}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
                >
                  +฿{amount}
                </button>
              ))}
              <button
                onClick={() => setPaymentAmount(total.toFixed(2))}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 rounded-lg font-semibold transition-colors"
              >
                พอดี
              </button>
            </div>
          </div>

          {paymentValue > 0 && (
            <div className={`rounded-xl p-4 ${
              change >= 0 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {change >= 0 ? 'เงินทอน' : 'เงินไม่พอ'}
                </span>
                <span className={`text-3xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(change))}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                if (change >= 0) {
                  handlePaymentSuccess('cash');
                } else {
                  alert('❌ จำนวนเงินไม่เพียงพอ!');
                }
              }}
              disabled={paymentValue <= 0 || change < 0 || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                paymentValue > 0 && change >= 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                <Banknote className="mr-2" size={24} />
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการชำระเงิน'}
              </div>
            </button>

            <button
              onClick={() => handlePaymentSuccess('card')}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                !isSubmitting
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                <CreditCard className="mr-2" size={24} />
                {isSubmitting ? 'กำลังบันทึก...' : 'ชำระด้วยบัตร'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal
  const SuccessModal = () => {
    if (!paymentSuccessData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[scaleIn_0.3s_ease-out]">
          {/* Success Header with Animation */}
          <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 text-white p-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center">
              {/* Animated Check Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg animate-[bounceIn_0.5s_ease-out]">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h2 className="text-2xl font-bold">ชำระเงินสำเร็จ!</h2>
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>

              <p className="text-green-100 text-sm">
                ขอบคุณที่ใช้บริการ
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-4">
            {/* Payment Method Badge */}
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                paymentSuccessData.paymentMethod === 'cash'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {paymentSuccessData.paymentMethod === 'cash' ? (
                  <>
                    <Banknote className="w-4 h-4 mr-2" />
                    ชำระด้วยเงินสด
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    ชำระด้วยบัตร
                  </>
                )}
              </span>
            </div>

            {/* Receipt Details */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-center text-gray-500 text-sm mb-3">
                <Receipt className="w-4 h-4 mr-2" />
                รายละเอียดการชำระเงิน
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">จำนวนสินค้า</span>
                <span className="font-semibold text-gray-800">{paymentSuccessData.items} ชิ้น</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">ยอดชำระ</span>
                <span className="font-bold text-xl text-gray-800">{formatCurrency(paymentSuccessData.total)}</span>
              </div>

              {paymentSuccessData.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">รับเงิน</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(paymentSuccessData.received)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-xl px-4 -mx-1">
                    <span className="font-semibold text-green-700">เงินทอน</span>
                    <span className="font-bold text-2xl text-green-600">{formatCurrency(paymentSuccessData.change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={closeSuccessModal}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl mt-4"
            >
              เสร็จสิ้น
            </button>

            {/* Auto close indicator */}
            <p className="text-center text-gray-400 text-xs">
              หน้าต่างนี้จะปิดอัตโนมัติใน 5 วินาที
            </p>
          </div>
        </div>
      </div>
    );
  };

  // History Modal - Receipt Style
  const HistoryModal = () => {
    const formatDateTime = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getPaymentMethodText = (method: string) => {
      switch (method) {
        case 'CASH': return 'เงินสด';
        case 'CARD': return 'บัตร';
        case 'QR': return 'QR Code';
        default: return method;
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'COMPLETED':
          return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">สำเร็จ</span>;
        case 'VOIDED':
          return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">ยกเลิก</span>;
        case 'REFUNDED':
          return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">คืนเงิน</span>;
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Receipt className="mr-3" size={28} />
                <div>
                  <h2 className="text-2xl font-bold">ประวัติใบเสร็จ</h2>
                  <p className="text-purple-100 text-sm mt-1">รายการขายทั้งหมด {historyMeta.total} รายการ</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {historyLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">ยังไม่มีประวัติการขาย</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-2">
                  {transactions.map((tx) => {
                    const isRefunded = tx.status === 'REFUNDED';
                    const isVoided = tx.status === 'VOIDED';
                    const isInactive = isRefunded || isVoided;

                    return (
                    <div
                      key={tx.id}
                      className={`bg-white rounded-lg shadow-md overflow-hidden font-mono text-sm transition-shadow relative ${
                        isInactive ? 'opacity-80' : 'hover:shadow-lg'
                      }`}
                    >
                      {/* Receipt Header */}
                      <div className={`px-4 py-3 text-center ${
                        isRefunded
                          ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                          : isVoided
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                          : 'bg-gray-800 text-white'
                      }`}>
                        <div className="text-lg font-bold">
                          {isRefunded ? '🔄 REFUNDED' : isVoided ? '❌ VOIDED' : '🏪 MINIMART'}
                        </div>
                        <div className={`text-xs ${isInactive ? 'opacity-80' : 'text-gray-300'}`}>
                          {isRefunded ? 'ใบเสร็จคืนเงิน' : isVoided ? 'ใบเสร็จยกเลิก' : 'ใบเสร็จรับเงิน / Receipt'}
                        </div>
                      </div>

                      {/* Receipt Info */}
                      <div className="px-4 py-2 border-b border-dashed border-gray-300 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>เลขที่:</span>
                          <span className={`font-semibold ${isInactive ? 'text-gray-500' : 'text-gray-800'}`}>#{tx.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>วันที่:</span>
                          <span>{formatDateTime(tx.createdAt)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>สถานะ:</span>
                          {getStatusBadge(tx.status)}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-4 py-2 border-b border-dashed border-gray-300">
                        <div className="text-xs text-gray-500 mb-2">รายการสินค้า</div>
                        <div className="space-y-1">
                          {tx.items?.map((item) => (
                            <div key={item.id} className={`flex justify-between text-xs ${isInactive ? 'text-gray-400' : ''}`}>
                              <div className="flex-1 truncate pr-2">
                                <span className={isInactive ? 'line-through' : 'text-gray-800'}>{item.product?.name || 'สินค้า'}</span>
                                <span className={`ml-1 ${isInactive ? 'line-through' : 'text-gray-500'}`}>x{item.quantity}</span>
                              </div>
                              <span className={`font-medium whitespace-nowrap ${isInactive ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="px-4 py-2 border-b border-dashed border-gray-300 text-xs">
                        <div className={`flex justify-between ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className={isInactive ? 'line-through' : ''}>ยอดรวม</span>
                          <span className={isInactive ? 'line-through' : ''}>{formatCurrency(tx.subtotal)}</span>
                        </div>
                        {tx.discount > 0 && (
                          <div className={`flex justify-between ${isInactive ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                            <span>ส่วนลด</span>
                            <span>-{formatCurrency(tx.discount)}</span>
                          </div>
                        )}
                        <div className={`flex justify-between font-bold text-base mt-1 pt-1 border-t border-gray-200 ${
                          isRefunded
                            ? 'text-orange-500'
                            : isVoided
                            ? 'text-red-500'
                            : 'text-gray-800'
                        }`}>
                          <span>{isRefunded ? 'ยอดคืนเงิน' : isVoided ? 'ยอดยกเลิก' : 'รวมทั้งสิ้น'}</span>
                          <span className={isInactive ? 'line-through' : ''}>{formatCurrency(tx.total)}</span>
                        </div>
                      </div>

                      {/* Payment Info */}
                      {tx.payment && (
                        <div className="px-4 py-2 border-b border-dashed border-gray-300 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>ชำระโดย</span>
                            <span className="font-medium">{getPaymentMethodText(tx.payment.method)}</span>
                          </div>
                          {tx.payment.method === 'CASH' && (
                            <>
                              <div className="flex justify-between text-gray-600">
                                <span>รับเงิน</span>
                                <span>{formatCurrency(tx.payment.amount)}</span>
                              </div>
                              <div className="flex justify-between text-green-600 font-medium">
                                <span>เงินทอน</span>
                                <span>{formatCurrency(tx.payment.change)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Receipt Footer */}
                      <div className="px-4 py-3 text-center text-xs text-gray-500 bg-gray-50">
                        <div>*** ขอบคุณที่ใช้บริการ ***</div>
                        <div className="text-[10px] mt-1">Thank you for shopping!</div>
                      </div>

                      {/* Refund Button - Only for COMPLETED transactions */}
                      {tx.status === 'COMPLETED' && (
                        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                          <button
                            onClick={() => openRefundModal(tx)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <RotateCcw size={16} />
                            คืนเงิน (Refund)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>

                {/* Pagination */}
                {historyMeta.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-300">
                    <button
                      onClick={() => loadHistory(historyPage - 1)}
                      disabled={historyPage <= 1}
                      className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                        historyPage <= 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      <ChevronLeft size={20} className="mr-1" />
                      ก่อนหน้า
                    </button>
                    <span className="text-gray-600 font-medium">
                      หน้า {historyPage} / {historyMeta.totalPages}
                    </span>
                    <button
                      onClick={() => loadHistory(historyPage + 1)}
                      disabled={historyPage >= historyMeta.totalPages}
                      className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${
                        historyPage >= historyMeta.totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      ถัดไป
                      <ChevronRight size={20} className="ml-1" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Fixed Header + Barcode Scanner */}
      <div className="fixed top-0 left-0 right-0 z-40">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-colors"
                >
                  <Home size={24} />
                </Link>
                <div className="bg-white bg-opacity-20 p-2 rounded-xl backdrop-blur-sm">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Minimart POS</h1>
                  <p className="text-blue-100 text-xs">ระบบขายหน้าร้าน</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={openHistory}
                  className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-colors flex items-center"
                  title="ประวัติการขาย"
                >
                  <History size={24} />
                </button>
                <Link
                  href="/admin/promotions"
                  className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-colors flex items-center"
                  title="จัดการโปรโมชั่น"
                >
                  <Gift size={24} />
                </Link>
                <Link
                  href="/admin/inventory"
                  className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-colors flex items-center"
                  title="คลังสินค้า"
                >
                  <Package size={24} />
                </Link>
                <div className="text-right">
                  <div className="text-xs text-blue-100">วันที่</div>
                  <div className="text-sm font-semibold">
                    {formatDate(new Date())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode Scanner - Fixed below header */}
        <div className="bg-white shadow-lg border-b-2 border-blue-200">
          <div className="container mx-auto px-4 py-3">
            <form onSubmit={handleBarcodeScan} className="flex gap-3">
              <div className="flex-1 relative">
                <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={24} />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="สแกนบาร์โค้ดหรือกด F2..."
                  className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors font-mono"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                สแกน
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[140px]"></div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า หรือ บาร์โค้ด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const restricted = isTimeRestricted(product);
                const outOfStock = isOutOfStock(product);
                const lowStock = isLowStock(product);
                const hasPromo = hasActivePromotion(product);
                const cannotAdd = outOfStock || restricted;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group relative ${
                      cannotAdd ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    {/* Promotion Badge - Top Left */}
                    {hasPromo && product.promotion && (
                      <div className={`absolute top-0 left-0 z-10 bg-gradient-to-r ${getPromotionColor(product.promotion.type)} text-white text-xs px-2 py-1 rounded-br-lg font-bold flex items-center shadow-lg`}>
                        {product.promotion.type === 'discount' && <Percent size={12} className="mr-1" />}
                        {product.promotion.type === 'bundle' && <Gift size={12} className="mr-1" />}
                        {product.promotion.type === 'flash' && <Zap size={12} className="mr-1" />}
                        {product.promotion.type === 'points' && <Tag size={12} className="mr-1" />}
                        {product.promotion.label}
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center relative">
                      <span className={`text-5xl transition-transform duration-200 ${cannotAdd ? '' : 'group-hover:scale-110'}`}>
                        {product.image}
                      </span>

                      {/* Status Badges - Top Right */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {outOfStock && (
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center">
                            <X size={12} className="mr-1" />
                            สินค้าหมด
                          </div>
                        )}
                        {!outOfStock && lowStock && (
                          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center">
                            <AlertCircle size={12} className="mr-1" />
                            เหลือน้อย
                          </div>
                        )}
                        {restricted && !outOfStock && (
                          <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center">
                            <Clock size={12} className="mr-1" />
                            นอกเวลา
                          </div>
                        )}
                      </div>

                      {/* Out of Stock Overlay */}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                          <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg transform -rotate-12 shadow-lg">
                            SOLD OUT
                          </div>
                        </div>
                      )}

                      {/* Time Restriction Overlay */}
                      {restricted && !outOfStock && (
                        <div className="absolute inset-0 bg-purple-900/20 flex items-center justify-center">
                          <div className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs text-center transform -rotate-12 shadow-lg max-w-[90%]">
                            <Clock size={14} className="inline mr-1" />
                            {getTimeRestrictionMessage(product) || 'ไม่อยู่ในเวลาขาย'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">คงเหลือ: {product.stock} {product.unit}</p>
                      <div className="flex justify-between items-center">
                        <span className={`text-xl font-bold ${hasPromo ? 'text-green-600' : 'text-blue-600'}`}>
                          {formatCurrency(product.price)}
                        </span>
                        <Plus className={`text-white rounded-full p-1 ${
                          cannotAdd ? 'bg-gray-400' : 'bg-blue-500 group-hover:bg-blue-600'
                        } transition-colors`} size={24} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-lg">ไม่พบสินค้า</p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl sticky top-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl">
                <h2 className="text-2xl font-bold flex items-center">
                  <ShoppingCart className="mr-2" size={28} />
                  รายการสินค้า
                </h2>
                <div className="flex justify-between mt-2 text-blue-100 text-sm">
                  <span>{cart.length} รายการ</span>
                  <span>{totalItems} ชิ้น</span>
                </div>
              </div>

              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-400 text-lg">ไม่มีสินค้าในตะกร้า</p>
                    <p className="text-gray-400 text-sm mt-2">สแกนหรือเลือกสินค้า</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4 pr-2">
                      {cart.map(item => (
                        <div key={item.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 hover:from-blue-50 hover:to-indigo-50 transition-colors border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 text-sm leading-tight">{item.name}</h4>
                              <p className="text-blue-600 font-bold text-sm">{formatCurrency(item.price)} / {item.unit}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm">
                              <button
                                onClick={() => decreaseQuantity(item.id)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md p-1.5 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="font-bold text-gray-800 px-3 text-sm">{item.quantity}</span>
                              <button
                                onClick={() => increaseQuantity(item.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-md p-1.5 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="font-bold text-lg text-gray-800">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4 space-y-2 mb-4">
                      <div className="flex justify-between text-gray-600">
                        <span>ยอดรวม ({totalItems} ชิ้น)</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>

                      {/* Applied Promotions */}
                      {appliedPromotions.length > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 space-y-2 border border-green-200">
                          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                            <Gift size={16} />
                            <span>โปรโมชั่นที่ได้รับ</span>
                          </div>
                          {appliedPromotions.map((promo) => (
                            <div key={promo.promotionId} className="flex justify-between text-sm">
                              <span className="text-green-700">{promo.name}</span>
                              <span className="font-semibold text-green-600">-{formatCurrency(promo.discount)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {discount > 0 && (
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>ส่วนลดโปรโมชั่น</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-2xl font-bold text-gray-800 pt-2 border-t-2 border-gray-300">
                        <span>รวมทั้งสิ้น</span>
                        <span className="text-blue-600">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <div className="flex items-center justify-center">
                          <CreditCard className="mr-2" size={24} />
                          ชำระเงิน
                        </div>
                      </button>
                      <button
                        onClick={clearCart}
                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                      >
                        ล้างรายการ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Left Panel - Promotions */}
      <div className={`fixed top-[140px] left-0 h-[calc(100vh-140px)] z-40 transition-all duration-300 ease-in-out ${
        isPromoPanelOpen ? 'w-80' : 'w-0'
      }`}>
        {/* Panel Content */}
        <div className={`h-full w-80 bg-white shadow-2xl border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          isPromoPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Tag className="mr-2" size={22} />
                <div>
                  <h2 className="text-lg font-bold">โปรโมชั่น</h2>
                  <p className="text-orange-100 text-xs">{promotions.length} รายการ</p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoPanelOpen(false)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="ซ่อนแผง"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="h-[calc(100%-80px)] overflow-y-auto p-4 space-y-3">
            {promotions.map((promo) => {
              const IconComponent = promo.icon;
              return (
                <div key={promo.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Promo Header */}
                  <div className={`bg-gradient-to-r ${promo.color} text-white px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <IconComponent size={20} className="mr-2" />
                        <span className="font-bold">{promo.title}</span>
                      </div>
                      <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-bold">
                        {promo.discount}
                      </span>
                    </div>
                  </div>
                  {/* Promo Body */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-700 mb-2">{promo.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span>หมดเขต: {promo.validUntil}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* More Promos Banner */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 text-center">
              <Sparkles className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600 font-medium">ติดตามโปรโมชั่นเพิ่มเติม</p>
              <p className="text-xs text-gray-500 mt-1">ที่ป้ายประกาศหน้าร้าน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button for Promo Panel - Show when panel is closed */}
      {!isPromoPanelOpen && (
        <button
          onClick={() => setIsPromoPanelOpen(true)}
          className="fixed left-0 top-[calc(140px+50%)] -translate-y-1/2 z-40 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-r-xl shadow-lg hover:from-orange-600 hover:to-red-600 transition-all"
          title="แสดงโปรโมชั่น"
        >
          <div className="flex flex-col items-center">
            <PanelLeftOpen size={24} />
            <span className="mt-1 bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {promotions.length}
            </span>
          </div>
        </button>
      )}

      {/* Collapsible Right Panel - Paid Transactions */}
      <div className={`fixed top-[140px] right-0 h-[calc(100vh-140px)] z-40 transition-all duration-300 ease-in-out ${
        isPaidPanelOpen ? 'w-80' : 'w-0'
      }`}>
        {/* Panel Content */}
        <div className={`h-full w-80 bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-in-out ${
          isPaidPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2" size={22} />
                <div>
                  <h2 className="text-lg font-bold">รายการที่ชำระแล้ว</h2>
                  <p className="text-emerald-100 text-xs">{recentPaidTransactions.length} รายการล่าสุด</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaidPanelOpen(false)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="ซ่อนแผง"
              >
                <PanelRightClose size={20} />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-3">
            {recentPaidTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 text-sm">ยังไม่มีรายการที่ชำระ</p>
              </div>
            ) : (
              recentPaidTransactions.map((tx) => {
                const txDate = new Date(tx.createdAt);
                const timeStr = txDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const dateStr = txDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
                const paymentMethod = tx.payment?.method === 'CASH' ? 'เงินสด' : tx.payment?.method === 'CARD' ? 'บัตร' : tx.payment?.method;
                const itemCount = tx.items?.length || 0;
                const isRefunded = tx.status === 'REFUNDED';
                const isVoided = tx.status === 'VOIDED';
                const isInactive = isRefunded || isVoided;

                return (
                  <div
                    key={tx.id}
                    className={`rounded-xl p-4 border transition-shadow relative ${
                      isRefunded
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300 opacity-75'
                        : isVoided
                        ? 'bg-gradient-to-r from-red-50 to-gray-50 border-red-200 opacity-75'
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-md'
                    }`}
                  >
                    {/* Strikethrough overlay for refunded/voided */}
                    {isInactive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-full h-0.5 ${isRefunded ? 'bg-orange-400' : 'bg-red-400'} opacity-50 rotate-[-5deg]`}></div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isInactive ? 'text-gray-500' : 'text-gray-800'}`}>#{tx.id}</span>
                        {isRefunded ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1">
                            <RotateCcw size={10} />
                            คืนเงินแล้ว
                          </span>
                        ) : isVoided ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            ยกเลิก
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                            สำเร็จ
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{dateStr} {timeStr}</span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {tx.items?.slice(0, 3).map((item) => (
                        <div key={item.id} className={`flex justify-between text-sm ${isInactive ? 'text-gray-400' : ''}`}>
                          <span className={`truncate flex-1 mr-2 ${isInactive ? 'line-through' : 'text-gray-600'}`}>
                            {item.product?.name || 'สินค้า'}
                          </span>
                          <span className={`font-medium ${isInactive ? 'line-through text-gray-400' : 'text-gray-800'}`}>x{item.quantity}</span>
                        </div>
                      ))}
                      {itemCount > 3 && (
                        <p className="text-xs text-gray-400">+{itemCount - 3} รายการเพิ่มเติม</p>
                      )}
                    </div>
                    <div className={`flex justify-between items-center pt-2 border-t ${isInactive ? 'border-gray-200' : 'border-emerald-200'}`}>
                      <span className="text-xs text-gray-500">{paymentMethod}</span>
                      <span className={`font-bold text-lg ${
                        isRefunded
                          ? 'text-orange-500 line-through'
                          : isVoided
                          ? 'text-red-500 line-through'
                          : 'text-emerald-600'
                      }`}>{formatCurrency(tx.total)}</span>
                    </div>
                    {/* Refund Button - Only for COMPLETED */}
                    {tx.status === 'COMPLETED' && (
                      <button
                        onClick={() => openRefundModal(tx)}
                        className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 px-3 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <RotateCcw size={12} />
                        คืนเงิน
                      </button>
                    )}
                    {/* Refunded indicator */}
                    {isRefunded && (
                      <div className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 px-3 bg-gray-200 text-gray-500 text-xs font-medium rounded-lg cursor-not-allowed">
                        <RotateCcw size={12} />
                        ดำเนินการคืนเงินแล้ว
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <button
              onClick={openHistory}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center"
            >
              <History size={18} className="mr-2" />
              ดูประวัติทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button - Show when panel is closed */}
      {!isPaidPanelOpen && (
        <button
          onClick={() => setIsPaidPanelOpen(true)}
          className="fixed right-0 top-[calc(140px+50%)] -translate-y-1/2 z-40 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 rounded-l-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
          title="แสดงรายการที่ชำระแล้ว"
        >
          <div className="flex flex-col items-center">
            <PanelRightOpen size={24} />
            {recentPaidTransactions.length > 0 && (
              <span className="mt-1 bg-white text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {recentPaidTransactions.length}
              </span>
            )}
          </div>
        </button>
      )}

      {showCheckout && <CheckoutModal />}
      {showSuccessModal && <SuccessModal />}
      {showHistory && <HistoryModal />}
      {showRefundModal && refundingTransaction && (
        <RefundModalComponent
          transaction={refundingTransaction}
          reason={refundReason}
          onReasonChange={setRefundReason}
          onClose={closeRefundModal}
          onConfirm={handleRefund}
          isRefunding={isRefunding}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
