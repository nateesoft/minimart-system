'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Gift,
  Percent,
  Zap,
  Tag,
  ChevronLeft,
  Search,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  Home,
} from 'lucide-react';
import type { Promotion, PromotionType, CreatePromotionData } from '@/types';
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionActive,
  fetchAllProducts,
  login,
  getAuthToken,
  ApiError,
  type ApiProductFull,
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// Promotion type labels
const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  BUY_X_GET_Y: 'ซื้อ X แถม Y',
  QUANTITY_DISCOUNT: 'ซื้อ X ชิ้น ลด %',
  BUNDLE_FREE: 'ซื้อ A+B แถม C',
  NEXT_ITEM_DISCOUNT: 'ซื้อ X ชิ้นต่อไปลด %',
};

const PROMOTION_TYPE_ICONS: Record<PromotionType, React.ReactNode> = {
  BUY_X_GET_Y: <Gift size={18} />,
  QUANTITY_DISCOUNT: <Percent size={18} />,
  BUNDLE_FREE: <Tag size={18} />,
  NEXT_ITEM_DISCOUNT: <Zap size={18} />,
};

const PROMOTION_TYPE_COLORS: Record<PromotionType, string> = {
  BUY_X_GET_Y: 'from-orange-500 to-red-500',
  QUANTITY_DISCOUNT: 'from-green-500 to-emerald-500',
  BUNDLE_FREE: 'from-blue-500 to-cyan-500',
  NEXT_ITEM_DISCOUNT: 'from-purple-500 to-pink-500',
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

export default function PromotionManagement() {
  // State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<ApiProductFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PromotionType | 'all'>('all');
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Form state
  const [formData, setFormData] = useState<CreatePromotionData>({
    name: '',
    description: '',
    type: 'BUY_X_GET_Y',
    isActive: true,
    buyQuantity: 2,
    freeQuantity: 1,
    discountPercent: 10,
    triggerProductIds: [],
    freeProductIds: [],
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!getAuthToken()) {
        await login('admin', 'admin1234');
      }
      const [promoResult, productList] = await Promise.all([
        fetchPromotions({ limit: 100 }),
        fetchAllProducts(),
      ]);
      setPromotions(promoResult.data);
      setProducts(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter promotions
  const filteredPromotions = promotions.filter((promo) => {
    if (searchTerm && !promo.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && promo.type !== filterType) {
      return false;
    }
    if (filterActive !== 'all' && promo.isActive !== filterActive) {
      return false;
    }
    return true;
  });

  // Open create modal
  const openCreateModal = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      description: '',
      type: 'BUY_X_GET_Y',
      isActive: true,
      buyQuantity: 2,
      freeQuantity: 1,
      discountPercent: 10,
      triggerProductIds: [],
      freeProductIds: [],
    });
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      isActive: promo.isActive,
      startDate: promo.startDate,
      endDate: promo.endDate,
      buyQuantity: promo.buyQuantity || 2,
      freeQuantity: promo.freeQuantity || 1,
      discountPercent: promo.discountPercent || 10,
      discountAmount: promo.discountAmount,
      triggerProductIds: promo.products.filter((p) => p.role === 'trigger').map((p) => p.productId),
      freeProductIds: promo.products.filter((p) => p.role === 'free').map((p) => p.productId),
    });
    setShowModal(true);
  };

  // Save promotion
  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('error', 'กรุณาระบุชื่อโปรโมชั่น');
      return;
    }
    if (formData.triggerProductIds.length === 0) {
      showToast('error', 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, formData);
        showToast('success', 'อัปเดตโปรโมชั่นเรียบร้อย');
      } else {
        await createPromotion(formData);
        showToast('success', 'สร้างโปรโมชั่นเรียบร้อย');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete promotion
  const handleDelete = async (id: number) => {
    try {
      await deletePromotion(id);
      showToast('success', 'ลบโปรโมชั่นเรียบร้อย');
      setDeletingId(null);
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  // Toggle active
  const handleToggleActive = async (id: number) => {
    try {
      await togglePromotionActive(id);
      loadData();
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  // Product selection helpers
  const toggleProduct = (productId: number, field: 'triggerProductIds' | 'freeProductIds') => {
    setFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(productId)) {
        return { ...prev, [field]: current.filter((id) => id !== productId) };
      } else {
        return { ...prev, [field]: [...current, productId] };
      }
    });
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
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
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
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
                  <Gift size={28} />
                  จัดการโปรโมชั่น
                </h1>
                <p className="text-purple-200 text-sm">Promotion Management</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
            >
              <Plus size={20} />
              สร้างโปรโมชั่น
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาโปรโมชั่น..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PromotionType | 'all')}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="all">ทุกประเภท</option>
              {Object.entries(PROMOTION_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>

            {/* Active filter */}
            <select
              value={filterActive === 'all' ? 'all' : String(filterActive)}
              onChange={(e) =>
                setFilterActive(e.target.value === 'all' ? 'all' : e.target.value === 'true')
              }
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="true">เปิดใช้งาน</option>
              <option value="false">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        {/* Promotions Grid */}
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Gift size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">ไม่พบโปรโมชั่น</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              สร้างโปรโมชั่นใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPromotions.map((promo) => (
              <div
                key={promo.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
                  !promo.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Card Header */}
                <div
                  className={`bg-gradient-to-r ${PROMOTION_TYPE_COLORS[promo.type]} text-white p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {PROMOTION_TYPE_ICONS[promo.type]}
                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                        {PROMOTION_TYPE_LABELS[promo.type]}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(promo.id)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      title={promo.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {promo.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold mt-2">{promo.name}</h3>
                  {promo.description && (
                    <p className="text-sm opacity-90 mt-1">{promo.description}</p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Rule info */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {promo.type === 'BUY_X_GET_Y' && (
                      <p>
                        ซื้อ <span className="font-bold text-purple-600">{promo.buyQuantity}</span>{' '}
                        แถม <span className="font-bold text-green-600">{promo.freeQuantity}</span>
                      </p>
                    )}
                    {promo.type === 'QUANTITY_DISCOUNT' && (
                      <p>
                        ซื้อ <span className="font-bold text-purple-600">{promo.buyQuantity}</span>{' '}
                        ชิ้น ลด{' '}
                        <span className="font-bold text-green-600">{promo.discountPercent}%</span>
                      </p>
                    )}
                    {promo.type === 'BUNDLE_FREE' && (
                      <p>
                        ซื้อครบชุด แถม{' '}
                        <span className="font-bold text-green-600">{promo.freeQuantity || 1}</span>{' '}
                        ชิ้น
                      </p>
                    )}
                    {promo.type === 'NEXT_ITEM_DISCOUNT' && (
                      <p>
                        ซื้อ <span className="font-bold text-purple-600">{promo.buyQuantity}</span>{' '}
                        ชิ้นต่อไปลด{' '}
                        <span className="font-bold text-green-600">{promo.discountPercent}%</span>
                      </p>
                    )}
                  </div>

                  {/* Products */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">สินค้าที่ร่วมรายการ:</p>
                    <div className="flex flex-wrap gap-1">
                      {promo.products
                        .filter((p) => p.role === 'trigger')
                        .slice(0, 3)
                        .map((p) => (
                          <span
                            key={p.id}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                          >
                            {p.product.name}
                          </span>
                        ))}
                      {promo.products.filter((p) => p.role === 'trigger').length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{promo.products.filter((p) => p.role === 'trigger').length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500">
                    {promo.startDate || promo.endDate ? (
                      <span>
                        {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </span>
                    ) : (
                      <span>ไม่จำกัดเวลา</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(promo)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => setDeletingId(promo.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift size={28} />
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingPromotion ? 'แก้ไขโปรโมชั่น' : 'สร้างโปรโมชั่นใหม่'}
                    </h2>
                    <p className="text-purple-200 text-sm">
                      {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อโปรโมชั่น <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ซื้อ 2 แถม 1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="คำอธิบายโปรโมชั่น..."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ประเภทโปรโมชั่น <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PROMOTION_TYPE_LABELS) as PromotionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        formData.type === type
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {PROMOTION_TYPE_ICONS[type]}
                      <span className="text-sm font-medium">{PROMOTION_TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Parameters */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-gray-700">เงื่อนไขโปรโมชั่น</p>

                {(formData.type === 'BUY_X_GET_Y' ||
                  formData.type === 'QUANTITY_DISCOUNT' ||
                  formData.type === 'NEXT_ITEM_DISCOUNT') && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">จำนวนที่ต้องซื้อ</label>
                      <input
                        type="number"
                        value={formData.buyQuantity || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || 0 })
                        }
                        min={1}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    {formData.type === 'BUY_X_GET_Y' && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">จำนวนที่แถม</label>
                        <input
                          type="number"
                          value={formData.freeQuantity || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, freeQuantity: parseInt(e.target.value) || 0 })
                          }
                          min={1}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    )}
                    {(formData.type === 'QUANTITY_DISCOUNT' ||
                      formData.type === 'NEXT_ITEM_DISCOUNT') && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">เปอร์เซ็นต์ลด</label>
                        <input
                          type="number"
                          value={formData.discountPercent || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discountPercent: parseFloat(e.target.value) || 0,
                            })
                          }
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.type === 'BUNDLE_FREE' && (
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">จำนวนที่แถม</label>
                    <input
                      type="number"
                      value={formData.freeQuantity || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, freeQuantity: parseInt(e.target.value) || 0 })
                      }
                      min={1}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Products Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  เลือกสินค้าที่ร่วมรายการ <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                        formData.triggerProductIds.includes(product.id) ? 'bg-purple-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.triggerProductIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id, 'triggerProductIds')}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-2xl">{product.image || '📦'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  เลือกแล้ว {formData.triggerProductIds.length} รายการ
                </p>
              </div>

              {/* Free Products (for BUNDLE_FREE) */}
              {formData.type === 'BUNDLE_FREE' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เลือกสินค้าที่แถม
                  </label>
                  <div className="border-2 border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                          formData.freeProductIds?.includes(product.id) ? 'bg-green-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.freeProductIds?.includes(product.id) || false}
                          onChange={() => toggleProduct(product.id, 'freeProductIds')}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className="text-2xl">{product.image || '📦'}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-700">เปิดใช้งานทันที</p>
                  <p className="text-xs text-gray-500">โปรโมชั่นจะมีผลทันทีหลังบันทึก</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`p-1 rounded-full transition-colors ${
                    formData.isActive ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {formData.isActive ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 shadow-lg'
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
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
              <p className="text-gray-600 mb-6">
                คุณต้องการลบโปรโมชั่นนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
