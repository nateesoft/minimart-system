# 🏪 Minimart POS System

ระบบ Point of Sale (POS) สำหรับร้านค้าปลีก (Minimart) ที่สร้างด้วย Next.js 14, TypeScript และ Tailwind CSS

![Minimart POS](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

## ✨ ฟีเจอร์หลัก

### 🛒 ระบบขายหน้าร้าน
- ✅ สแกนบาร์โค้ดสินค้า (กด F2 เพื่อโฟกัส)
- ✅ ค้นหาสินค้าแบบเรียลไทม์
- ✅ จัดการตะกร้าสินค้า (เพิ่ม/ลด/ลบ)
- ✅ แสดงสต็อกสินค้าคงเหลือ
- ✅ แจ้งเตือนสินค้าใกล้หมด (≤ 10 ชิ้น)
- ✅ ป้องกันขายสินค้าที่หมดสต็อก

### 💰 ระบบชำระเงิน
- ✅ คำนวณเงินทอนอัตโนมัติ
- ✅ ปุ่มจำนวนเงินด่วน (100, 500, 1000, พอดี)
- ✅ รองรับการชำระเงินสด
- ✅ รองรับการชำระด้วยบัตรเครดิต/เดบิต
- ✅ แสดงสรุปยอดชำระแบบละเอียด

### 📊 การจัดการสินค้า
- ✅ แบ่งหมวดหมู่สินค้า (เครื่องดื่ม, ขนม, อาหาร, ของใช้)
- ✅ แสดงข้อมูลสินค้าครบถ้วน (ชื่อ, ราคา, สต็อก, หน่วย)
- ✅ ระบบบาร์โค้ดมาตรฐาน EAN-13
- ✅ Responsive design ใช้งานได้ทุกอุปกรณ์

### 🎨 UI/UX
- ✅ ออกแบบสวยงามด้วย Gradient สีฟ้า-ม่วง
- ✅ Animation และ Hover effects ลื่นไหล
- ✅ แสดงข้อมูลชัดเจน อ่านง่าย
- ✅ รองรับภาษาไทยเต็มรูปแบบ

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดของระบบ
- Node.js 18.17 หรือสูงกว่า
- npm หรือ yarn หรือ pnpm

### ขั้นตอนการติดตั้ง

1. **Clone หรือ Download โปรเจค**
   ```bash
   cd minimart-pos-app
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   # หรือ
   yarn install
   # หรือ
   pnpm install
   ```

3. **รันโปรเจคในโหมด Development**
   ```bash
   npm run dev
   # หรือ
   yarn dev
   # หรือ
   pnpm dev
   ```

4. **เปิดเบราว์เซอร์**
   
   เข้าไปที่ [http://localhost:3000](http://localhost:3000)

## 📁 โครงสร้างโปรเจค

```
minimart-pos-app/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── pos/
│       └── page.tsx         # POS page
├── components/
│   └── minimart-pos.tsx     # Main POS component
├── data/
│   └── products.ts          # Products data
├── lib/
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript types
├── public/                  # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## 🎯 การใช้งาน

### หน้าหลัก (/)
- แสดงข้อมูลระบบและฟีเจอร์
- ปุ่มเริ่มต้นใช้งานระบบ POS

### หน้า POS (/pos)
1. **สแกนบาร์โค้ด**: กด F2 แล้วสแกนบาร์โค้ด หรือพิมพ์เลขบาร์โค้ด
2. **ค้นหาสินค้า**: พิมพ์ชื่อสินค้าหรือบาร์โค้ดในช่องค้นหา
3. **เลือกหมวดหมู่**: คลิกที่หมวดหมู่เพื่อกรองสินค้า
4. **เพิ่มสินค้า**: คลิกที่สินค้าเพื่อเพิ่มในตะกร้า
5. **จัดการตะกร้า**: ปรับจำนวนหรือลบสินค้าตามต้องการ
6. **ชำระเงิน**: คลิกปุ่มชำระเงิน ระบุจำนวนเงินที่รับ และยืนยัน

### คีย์ลัดที่ใช้งาน
- **F2**: โฟกัสที่ช่องสแกนบาร์โค้ด

## 🛠️ การปรับแต่ง

### เพิ่มสินค้าใหม่
แก้ไขไฟล์ `data/products.ts`:

```typescript
{
  id: 31,
  name: 'ชื่อสินค้า',
  category: 'หมวดหมู่', // drink, snack, food, household
  price: 99,
  barcode: '8851234560031',
  stock: 100,
  image: '🎁', // Emoji
  unit: 'ชิ้น'
}
```

### เพิ่มหมวดหมู่ใหม่
แก้ไขไฟล์ `data/products.ts`:

```typescript
{
  id: 'new-category',
  name: 'หมวดหมู่ใหม่',
  icon: '📦'
}
```

### ปรับแต่งสีและธีม
แก้ไขไฟล์ `tailwind.config.js`

### เพิ่มระบบส่วนลด
แก้ไขไฟล์ `components/minimart-pos.tsx` ในส่วน:
```typescript
const discount = 0; // เปลี่ยนเป็นจำนวนเงินหรือเปอร์เซ็นต์ส่วนลด
```

## 📦 Build สำหรับ Production

```bash
npm run build
npm start

# หรือ
yarn build
yarn start

# หรือ
pnpm build
pnpm start
```

## 🔮 ฟีเจอร์ที่จะพัฒนาเพิ่มเติม

- [ ] ระบบสมาชิกและคะแนนสะสม
- [ ] รายงานยอดขายประจำวัน/เดือน
- [ ] ระบบพิมพ์ใบเสร็จ
- [ ] บันทึกข้อมูลลงฐานข้อมูล (PostgreSQL, MongoDB)
- [ ] ระบบจัดการพนักงาน
- [ ] สแกนบาร์โค้ดด้วยกล้อง
- [ ] รองรับ QR Payment (PromptPay)
- [ ] ระบบหลังบ้าน (Back Office)
- [ ] API สำหรับเชื่อมต่อกับระบบอื่น

## 📄 License

MIT License - สามารถนำไปใช้ได้ฟรีทั้งเชิงพาณิชย์และส่วนตัว

## 👨‍💻 ผู้พัฒนา

พัฒนาโดย Claude (Anthropic) สำหรับการเรียนรู้และใช้งานจริง

## 🙏 การสนับสนุน

หากพบปัญหาหรือต้องการข้อเสนอแนะ กรุณาแจ้งผ่าน Issues

---

**สนุกกับการใช้งาน Minimart POS! 🎉**
# minimart-system
