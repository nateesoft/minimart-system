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
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import type { Product, CartItem } from '@/types';
import { products, categories } from '@/data/products';
import { 
  formatCurrency, 
  formatDate,
  playBeepSound,
  isLowStock,
  isOutOfStock 
} from '@/lib/utils';

// Payment success data type
interface PaymentSuccessData {
  total: number;
  received: number;
  change: number;
  paymentMethod: 'cash' | 'card';
  items: number;
}

export default function MinimartPOS() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccessData | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       product.barcode.includes(searchTerm);
    return matchCategory && matchSearch;
  });

  // Scan barcode
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      playBeepSound();
      setBarcodeInput('');
    } else {
      alert('❌ ไม่พบสินค้า! กรุณาตรวจสอบบาร์โค้ดอีกครั้ง');
      setBarcodeInput('');
    }
  };

  // Add to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert(`❌ สินค้าคงเหลือไม่เพียงพอ (คงเหลือ ${product.stock} ${product.unit})`);
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (isOutOfStock(product)) {
        alert('❌ สินค้าหมด!');
        return;
      }
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
  const discount = 0;
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
  const handlePaymentSuccess = (method: 'cash' | 'card') => {
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

    // Auto close after 5 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      setPaymentSuccessData(null);
      clearCart();
    }, 5000);
  };

  // Close success modal manually
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setPaymentSuccessData(null);
    clearCart();
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
                  onClick={() => setPaymentAmount(amount.toString())}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
                >
                  ฿{amount}
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
              disabled={paymentValue <= 0 || change < 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                paymentValue > 0 && change >= 0
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center">
                <Banknote className="mr-2" size={24} />
                ยืนยันการชำระเงิน
              </div>
            </button>

            <button
              onClick={() => handlePaymentSuccess('card')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center">
                <CreditCard className="mr-2" size={24} />
                ชำระด้วยบัตร
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-30 transition-colors"
              >
                <Home size={24} />
              </Link>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <ShoppingCart size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Minimart POS</h1>
                <p className="text-blue-100 text-sm">ระบบขายหน้าร้าน</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">วันที่</div>
              <div className="text-lg font-semibold">
                {formatDate(new Date())}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-200">
              <form onSubmit={handleBarcodeScan} className="flex gap-3">
                <div className="flex-1 relative">
                  <ScanLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={24} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="สแกนบาร์โค้ดหรือกด F2..."
                    className="w-full pl-12 pr-4 py-3.5 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors font-mono"
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
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden group ${
                    isOutOfStock(product) ? 'opacity-50' : 'hover:scale-105'
                  }`}
                >
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center relative">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-200">
                      {product.image}
                    </span>
                    {isLowStock(product) && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center">
                        <AlertCircle size={12} className="mr-1" />
                        เหลือน้อย
                      </div>
                    )}
                    {isOutOfStock(product) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        หมด
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">คงเหลือ: {product.stock} {product.unit}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(product.price)}</span>
                      <Plus className={`text-white rounded-full p-1 ${
                        isOutOfStock(product) ? 'bg-gray-400' : 'bg-blue-500 group-hover:bg-blue-600'
                      } transition-colors`} size={24} />
                    </div>
                  </div>
                </div>
              ))}
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
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>ส่วนลด</span>
                          <span className="font-semibold">-{formatCurrency(discount)}</span>
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

      {showCheckout && <CheckoutModal />}
      {showSuccessModal && <SuccessModal />}
    </div>
  );
}
