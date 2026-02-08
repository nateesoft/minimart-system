'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Minus,
  ClipboardCheck,
  History,
  AlertTriangle,
  ChevronLeft,
  Home,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
} from 'lucide-react';
import type {
  InventoryTransaction,
  StockCount,
  StockOverview,
  LowStockProduct,
  ReceivingItem,
  InventoryTransactionType,
} from '@/types';
import {
  fetchStockOverview,
  fetchLowStockProducts,
  fetchInventoryTransactions,
  fetchStockCounts,
  fetchAllProducts,
  createReceiving,
  createIssuing,
  createStockCount,
  adjustStockCount,
  ApiError,
  type ApiProductFull,
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type TabType = 'overview' | 'receiving' | 'issuing' | 'stockcount';

const TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  RECEIVING: 'รับเข้า',
  ISSUING: 'จ่ายออก',
  ADJUSTMENT: 'ปรับปรุง',
  SALE: 'ขาย',
  REFUND: 'คืนสินค้า',
};

const TRANSACTION_TYPE_COLORS: Record<InventoryTransactionType, string> = {
  RECEIVING: 'bg-green-100 text-green-700',
  ISSUING: 'bg-orange-100 text-orange-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
  SALE: 'bg-purple-100 text-purple-700',
  REFUND: 'bg-pink-100 text-pink-700',
};

// Toast Component
interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          } text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="hover:bg-white/20 p-1 rounded">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function InventoryManagement() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [stockOverview, setStockOverview] = useState<StockOverview | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [products, setProducts] = useState<ApiProductFull[]>([]);

  // Form state - Receiving
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([{ productId: 0, quantity: 1 }]);
  const [receivingReference, setReceivingReference] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');

  // Form state - Issuing
  const [issuingProductId, setIssuingProductId] = useState<number>(0);
  const [issuingQuantity, setIssuingQuantity] = useState<number>(1);
  const [issuingReason, setIssuingReason] = useState('');
  const [issuingReference, setIssuingReference] = useState('');

  // Form state - Stock Count
  const [countProductId, setCountProductId] = useState<number>(0);
  const [countedQuantity, setCountedQuantity] = useState<number>(0);
  const [countNotes, setCountNotes] = useState('');

  // Search state
  const [productSearch, setProductSearch] = useState('');

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overview, lowStock, txns, counts, productList] = await Promise.all([
        fetchStockOverview(),
        fetchLowStockProducts(),
        fetchInventoryTransactions({ limit: 50 }),
        fetchStockCounts({ isAdjusted: false, limit: 50 }),
        fetchAllProducts(),
      ]);
      setStockOverview(overview);
      setLowStockProducts(lowStock);
      setTransactions(txns.data);
      setStockCounts(counts.data);
      setProducts(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered products for search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch)
  );

  // Receiving handlers
  const addReceivingItem = () => {
    setReceivingItems([...receivingItems, { productId: 0, quantity: 1 }]);
  };

  const removeReceivingItem = (index: number) => {
    if (receivingItems.length > 1) {
      setReceivingItems(receivingItems.filter((_, i) => i !== index));
    }
  };

  const updateReceivingItem = (index: number, field: 'productId' | 'quantity', value: number) => {
    const updated = [...receivingItems];
    updated[index] = { ...updated[index], [field]: value };
    setReceivingItems(updated);
  };

  const handleReceiving = async () => {
    const validItems = receivingItems.filter((item) => item.productId > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      showToast('error', 'กรุณาเลือกสินค้าและระบุจำนวน');
      return;
    }

    setIsSaving(true);
    try {
      await createReceiving({
        items: validItems,
        reference: receivingReference || undefined,
        notes: receivingNotes || undefined,
      });
      showToast('success', `รับสินค้าเข้า ${validItems.length} รายการสำเร็จ`);
      setReceivingItems([{ productId: 0, quantity: 1 }]);
      setReceivingReference('');
      setReceivingNotes('');
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  // Issuing handlers
  const handleIssuing = async () => {
    if (!issuingProductId || issuingQuantity < 1 || !issuingReason.trim()) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    try {
      await createIssuing({
        productId: issuingProductId,
        quantity: issuingQuantity,
        reason: issuingReason,
        reference: issuingReference || undefined,
      });
      showToast('success', 'จ่ายสินค้าออกสำเร็จ');
      setIssuingProductId(0);
      setIssuingQuantity(1);
      setIssuingReason('');
      setIssuingReference('');
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  // Stock count handlers
  const handleStockCount = async () => {
    if (!countProductId) {
      showToast('error', 'กรุณาเลือกสินค้า');
      return;
    }

    setIsSaving(true);
    try {
      await createStockCount({
        productId: countProductId,
        countedQuantity,
        notes: countNotes || undefined,
      });
      showToast('success', 'บันทึกการนับสต็อกสำเร็จ');
      setCountProductId(0);
      setCountedQuantity(0);
      setCountNotes('');
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustStock = async (id: number) => {
    try {
      await adjustStockCount(id);
      showToast('success', 'ปรับปรุงสต็อกสำเร็จ');
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/pos"
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
                <Home size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Package size={28} />
                  ระบบคลังสินค้า
                </h1>
                <p className="text-teal-200 text-sm">Inventory Management</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw size={18} />
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 bg-white rounded-xl shadow-md p-2">
          {[
            { id: 'overview' as TabType, label: 'ภาพรวม', icon: Package },
            { id: 'receiving' as TabType, label: 'รับเข้า', icon: ArrowDownToLine },
            { id: 'issuing' as TabType, label: 'จ่ายออก', icon: ArrowUpFromLine },
            { id: 'stockcount' as TabType, label: 'นับสต็อก', icon: ClipboardCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">สินค้าทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-800">{stockOverview?.totalProducts || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <AlertTriangle className="text-yellow-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">ใกล้หมด</p>
                    <p className="text-2xl font-bold text-yellow-600">{stockOverview?.lowStockCount || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">หมดสต็อก</p>
                    <p className="text-2xl font-bold text-red-600">{stockOverview?.outOfStockCount || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Package className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">มูลค่าสต็อก</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stockOverview?.totalValue || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Warning */}
            {lowStockProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <AlertTriangle size={20} />
                    สินค้าใกล้หมด ({lowStockProducts.length} รายการ)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">คงเหลือ</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">ขั้นต่ำ</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lowStockProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{product.image || '📦'}</span>
                              <div>
                                <p className="font-medium text-gray-800">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.barcode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-bold text-orange-600">{product.stock}</span>
                            <span className="text-gray-500 ml-1">{product.unit}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">{product.minStock}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              ใกล้หมด
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <History size={20} />
                  ประวัติการเคลื่อนไหวล่าสุด
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">ประเภท</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">จำนวน</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">คงเหลือ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">อ้างอิง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.slice(0, 20).map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tx.product.image || '📦'}</span>
                            <span className="font-medium text-gray-800">{tx.product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${TRANSACTION_TYPE_COLORS[tx.type]}`}
                          >
                            {TRANSACTION_TYPE_LABELS[tx.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold ${tx.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {tx.quantity > 0 ? '+' : ''}
                            {tx.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-800">{tx.currentStock}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{tx.reference || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Receiving Tab */}
        {activeTab === 'receiving' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receiving Form */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ArrowDownToLine size={20} />
                  รับสินค้าเข้า
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Product Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="ค้นหาสินค้า..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Receiving Items */}
                <div className="space-y-3">
                  {receivingItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => updateReceivingItem(index, 'productId', parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                      >
                        <option value={0}>-- เลือกสินค้า --</option>
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (คงเหลือ: {p.stock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateReceivingItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min={1}
                        className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-center"
                        placeholder="จำนวน"
                      />
                      {receivingItems.length > 1 && (
                        <button
                          onClick={() => removeReceivingItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addReceivingItem}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  เพิ่มรายการ
                </button>

                {/* Reference & Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={receivingReference}
                    onChange={(e) => setReceivingReference(e.target.value)}
                    placeholder="เลขที่เอกสาร (PO)"
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={receivingNotes}
                    onChange={(e) => setReceivingNotes(e.target.value)}
                    placeholder="หมายเหตุ"
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleReceiving}
                  disabled={isSaving}
                  className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isSaving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      รับสินค้าเข้า
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Receiving History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-700">ประวัติรับเข้าล่าสุด</h2>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions
                      .filter((tx) => tx.type === 'RECEIVING')
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{tx.product.name}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-bold">+{tx.quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Issuing Tab */}
        {activeTab === 'issuing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issuing Form */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ArrowUpFromLine size={20} />
                  จ่ายสินค้าออก
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <select
                  value={issuingProductId}
                  onChange={(e) => setIssuingProductId(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value={0}>-- เลือกสินค้า --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (คงเหลือ: {p.stock})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน</label>
                    <input
                      type="number"
                      value={issuingQuantity}
                      onChange={(e) => setIssuingQuantity(parseInt(e.target.value) || 0)}
                      min={1}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่เอกสาร</label>
                    <input
                      type="text"
                      value={issuingReference}
                      onChange={(e) => setIssuingReference(e.target.value)}
                      placeholder="TRF-001"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เหตุผล <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issuingReason}
                    onChange={(e) => setIssuingReason(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- เลือกเหตุผล --</option>
                    <option value="เสียหาย">เสียหาย</option>
                    <option value="หมดอายุ">หมดอายุ</option>
                    <option value="โอนย้ายสาขา">โอนย้ายสาขา</option>
                    <option value="ใช้ภายใน">ใช้ภายใน</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <button
                  onClick={handleIssuing}
                  disabled={isSaving}
                  className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isSaving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Minus size={20} />
                      จ่ายสินค้าออก
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Issuing History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-700">ประวัติจ่ายออกล่าสุด</h2>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">จำนวน</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions
                      .filter((tx) => tx.type === 'ISSUING')
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{tx.product.name}</td>
                          <td className="px-4 py-3 text-center text-red-600 font-bold">{tx.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{tx.reason || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stock Count Tab */}
        {activeTab === 'stockcount' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Count Form */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ClipboardCheck size={20} />
                  นับสต็อกสินค้า
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <select
                  value={countProductId}
                  onChange={(e) => {
                    const productId = parseInt(e.target.value);
                    setCountProductId(productId);
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      setCountedQuantity(product.stock);
                    }
                  }}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value={0}>-- เลือกสินค้า --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ในระบบ: {p.stock})
                    </option>
                  ))}
                </select>

                {countProductId > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600">
                      จำนวนในระบบ:{' '}
                      <span className="font-bold">
                        {products.find((p) => p.id === countProductId)?.stock || 0}
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่นับได้จริง</label>
                  <input
                    type="number"
                    value={countedQuantity}
                    onChange={(e) => setCountedQuantity(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-center text-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                  <input
                    type="text"
                    value={countNotes}
                    onChange={(e) => setCountNotes(e.target.value)}
                    placeholder="นับสต็อกประจำเดือน"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleStockCount}
                  disabled={isSaving}
                  className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isSaving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck size={20} />
                      บันทึกการนับ
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pending Stock Counts */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-100 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-700">รายการรอปรับปรุง</h2>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">ระบบ</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">นับได้</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">ผลต่าง</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockCounts
                      .filter((sc) => !sc.isAdjusted)
                      .map((sc) => (
                        <tr key={sc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{sc.product.image || '📦'}</span>
                              <span className="font-medium text-gray-800">{sc.product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{sc.systemQuantity}</td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600">{sc.countedQuantity}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-bold ${
                                sc.variance > 0
                                  ? 'text-green-600'
                                  : sc.variance < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {sc.variance > 0 ? '+' : ''}
                              {sc.variance}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleAdjustStock(sc.id)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                            >
                              ปรับปรุง
                            </button>
                          </td>
                        </tr>
                      ))}
                    {stockCounts.filter((sc) => !sc.isAdjusted).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          ไม่มีรายการรอปรับปรุง
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
