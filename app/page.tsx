import Link from 'next/link';
import { ShoppingCart, BarChart3, Package, Settings } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-3xl shadow-2xl">
              <ShoppingCart size={64} className="text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            Minimart POS
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ระบบ Point of Sale สำหรับร้านค้าปลีก ครบฟีเจอร์ ใช้งานง่าย พร้อมระบบสแกนบาร์โค้ด
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <ShoppingCart className="text-blue-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">ขายหน้าร้าน</h3>
            <p className="text-gray-600">ระบบขายที่รวดเร็วและใช้งานง่าย</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Package className="text-green-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">จัดการสต็อก</h3>
            <p className="text-gray-600">ตรวจสอบสินค้าคงเหลือแบบเรียลไทม์</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="text-purple-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">รายงานยอดขาย</h3>
            <p className="text-gray-600">สรุปยอดขายประจำวัน</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Settings className="text-orange-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">ตั้งค่าระบบ</h3>
            <p className="text-gray-600">ปรับแต่งระบบตามความต้องการ</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link 
            href="/pos"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            <ShoppingCart size={28} />
            เริ่มต้นใช้งานระบบ POS
          </Link>
        </div>

        {/* Features List */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            ฟีเจอร์หลักของระบบ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              '✅ สแกนบาร์โค้ดสินค้า (กด F2)',
              '✅ ค้นหาสินค้าแบบเรียลไทม์',
              '✅ จัดการตะกร้าสินค้า',
              '✅ คำนวณเงินทอนอัตโนมัติ',
              '✅ แสดงสต็อกสินค้าคงเหลือ',
              '✅ แจ้งเตือนสินค้าใกล้หมด',
              '✅ รองรับการชำระเงินหลายรูปแบบ',
              '✅ UI สวยงาม ใช้งานง่าย',
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-gray-700 text-lg">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
