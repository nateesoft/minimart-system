import type { Product, Category } from '@/types';

// Categories
export const categories: Category[] = [
  { id: 'all', name: 'ทั้งหมด', icon: '🏪' },
  { id: 'drink', name: 'เครื่องดื่ม', icon: '🥤' },
  { id: 'snack', name: 'ขนม', icon: '🍪' },
  { id: 'food', name: 'อาหาร', icon: '🍚' },
  { id: 'household', name: 'ของใช้', icon: '🧴' },
];

// Products
export const products: Product[] = [
  // เครื่องดื่ม
  { 
    id: 1, 
    name: 'น้ำดื่ม 600ml', 
    category: 'drink', 
    price: 8, 
    barcode: '8851234560001', 
    stock: 150, 
    image: '💧', 
    unit: 'ขวด' 
  },
  { 
    id: 2, 
    name: 'โค้ก 325ml', 
    category: 'drink', 
    price: 15, 
    barcode: '8851234560002', 
    stock: 80, 
    image: '🥤', 
    unit: 'กระป๋อง' 
  },
  { 
    id: 3, 
    name: 'เป็ปซี่ 325ml', 
    category: 'drink', 
    price: 15, 
    barcode: '8851234560003', 
    stock: 75, 
    image: '🥤', 
    unit: 'กระป๋อง' 
  },
  { 
    id: 4, 
    name: 'น้ำส้ม 100%', 
    category: 'drink', 
    price: 25, 
    barcode: '8851234560004', 
    stock: 45, 
    image: '🍊', 
    unit: 'กล่อง' 
  },
  { 
    id: 5, 
    name: 'กาแฟกระป๋อง', 
    category: 'drink', 
    price: 18, 
    barcode: '8851234560005', 
    stock: 60, 
    image: '☕', 
    unit: 'กระป๋อง' 
  },
  { 
    id: 6, 
    name: 'ชาเขียว', 
    category: 'drink', 
    price: 12, 
    barcode: '8851234560006', 
    stock: 90, 
    image: '🍵', 
    unit: 'ขวด' 
  },
  { 
    id: 7, 
    name: 'น้ำอัดลม Sprite', 
    category: 'drink', 
    price: 15, 
    barcode: '8851234560023', 
    stock: 65, 
    image: '🥤', 
    unit: 'กระป๋อง' 
  },
  { 
    id: 8, 
    name: 'น้ำแร่', 
    category: 'drink', 
    price: 10, 
    barcode: '8851234560024', 
    stock: 120, 
    image: '💧', 
    unit: 'ขวด' 
  },
  
  // ขนม
  { 
    id: 9, 
    name: 'มาม่า ต้มยำกุ้ง', 
    category: 'snack', 
    price: 7, 
    barcode: '8851234560007', 
    stock: 200, 
    image: '🍜', 
    unit: 'ซอง' 
  },
  { 
    id: 10, 
    name: 'เลย์ รสต้นตำรับ', 
    category: 'snack', 
    price: 20, 
    barcode: '8851234560008', 
    stock: 55, 
    image: '🥔', 
    unit: 'ถุง' 
  },
  { 
    id: 11, 
    name: 'โปเต้โก้ หมูสับ', 
    category: 'snack', 
    price: 6, 
    barcode: '8851234560009', 
    stock: 120, 
    image: '🍪', 
    unit: 'ถุง' 
  },
  { 
    id: 12, 
    name: 'ปังปอนด์', 
    category: 'snack', 
    price: 38, 
    barcode: '8851234560010', 
    stock: 30, 
    image: '🍰', 
    unit: 'ชิ้น' 
  },
  { 
    id: 13, 
    name: 'โออิชิ ราเมง', 
    category: 'snack', 
    price: 10, 
    barcode: '8851234560011', 
    stock: 85, 
    image: '🍥', 
    unit: 'ซอง' 
  },
  { 
    id: 14, 
    name: 'คิทแคท', 
    category: 'snack', 
    price: 35, 
    barcode: '8851234560012', 
    stock: 42, 
    image: '🍫', 
    unit: 'แพ็ค' 
  },
  { 
    id: 15, 
    name: 'พอกกี้', 
    category: 'snack', 
    price: 10, 
    barcode: '8851234560025', 
    stock: 95, 
    image: '🍫', 
    unit: 'กล่อง' 
  },
  { 
    id: 16, 
    name: 'ดอริโต้ส', 
    category: 'snack', 
    price: 25, 
    barcode: '8851234560026', 
    stock: 48, 
    image: '🌽', 
    unit: 'ถุง' 
  },
  
  // ของใช้
  { 
    id: 17, 
    name: 'ถุงดำ 5kg', 
    category: 'household', 
    price: 25, 
    barcode: '8851234560013', 
    stock: 95, 
    image: '🛍️', 
    unit: 'ม้วน' 
  },
  { 
    id: 18, 
    name: 'ทิชชู่ 10 แผ่น', 
    category: 'household', 
    price: 15, 
    barcode: '8851234560014', 
    stock: 110, 
    image: '📄', 
    unit: 'แพ็ค' 
  },
  { 
    id: 19, 
    name: 'แชมพูซันซิล', 
    category: 'household', 
    price: 89, 
    barcode: '8851234560015', 
    stock: 28, 
    image: '🧴', 
    unit: 'ขวด' 
  },
  { 
    id: 20, 
    name: 'ยาสีฟัน', 
    category: 'household', 
    price: 45, 
    barcode: '8851234560016', 
    stock: 38, 
    image: '🪥', 
    unit: 'หลอด' 
  },
  { 
    id: 21, 
    name: 'สบู่ล้างมือ', 
    category: 'household', 
    price: 35, 
    barcode: '8851234560017', 
    stock: 52, 
    image: '🧼', 
    unit: 'ขวด' 
  },
  { 
    id: 22, 
    name: 'ผงซักฟอก 1kg', 
    category: 'household', 
    price: 65, 
    barcode: '8851234560018', 
    stock: 25, 
    image: '🧺', 
    unit: 'ถุง' 
  },
  { 
    id: 23, 
    name: 'น้ำยาล้างจาน', 
    category: 'household', 
    price: 42, 
    barcode: '8851234560027', 
    stock: 35, 
    image: '🧴', 
    unit: 'ขวด' 
  },
  { 
    id: 24, 
    name: 'กระดาษชำระ', 
    category: 'household', 
    price: 55, 
    barcode: '8851234560028', 
    stock: 8, 
    image: '🧻', 
    unit: 'แพ็ค' 
  },
  
  // อาหาร
  { 
    id: 25, 
    name: 'ข้าวสาร 5kg', 
    category: 'food', 
    price: 185, 
    barcode: '8851234560019', 
    stock: 40, 
    image: '🌾', 
    unit: 'ถุง' 
  },
  { 
    id: 26, 
    name: 'ไข่ไก่ 10 ฟอง', 
    category: 'food', 
    price: 65, 
    barcode: '8851234560020', 
    stock: 35, 
    image: '🥚', 
    unit: 'ถาด' 
  },
  { 
    id: 27, 
    name: 'นมกล่อง 1L', 
    category: 'food', 
    price: 48, 
    barcode: '8851234560021', 
    stock: 55, 
    image: '🥛', 
    unit: 'กล่อง' 
  },
  { 
    id: 28, 
    name: 'ขนมปัง', 
    category: 'food', 
    price: 35, 
    barcode: '8851234560022', 
    stock: 48, 
    image: '🍞', 
    unit: 'ถุง' 
  },
  { 
    id: 29, 
    name: 'น้ำมันพืช 1L', 
    category: 'food', 
    price: 55, 
    barcode: '8851234560029', 
    stock: 42, 
    image: '🫗', 
    unit: 'ขวด' 
  },
  { 
    id: 30, 
    name: 'น้ำตาล 1kg', 
    category: 'food', 
    price: 38, 
    barcode: '8851234560030', 
    stock: 58, 
    image: '🍬', 
    unit: 'ถุง' 
  },
];
