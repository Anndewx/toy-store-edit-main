# ระบบจัดการเว็บไซต์ขายของเล่นเพื่อการพาณิชย์ออนไลน์(Web-based Platform for Online Toys Sales Management)
## พัฒนาโดย: นายอัครพนธ์ และ นายศรัณย์กร 

### วัตถุประสงค์หลัก
  1. เพื่อพัฒนาระบบเว็บไซต์ขายของเล่นออนไลน์ให้มี ประสิทธิภาพและมีความปลอดภัย
  2. เพื่อออกแบบระบบจัดการสินค้า คำสั่งซื้อ และข้อมูลลูกค้าสำหรับผู้ดูแลระบบ
  3. เพื่อศึกษาและประยุกต์ใช้ เทคโนโลยีเว็บสมัยใหม่ (React.js, Node.js) ในการพัฒนาเว็บไซต์ E-commerce
  4. เพื่อเพิ่มความสะดวกให้กับผู้ใช้งานในการเข้าถึงข้อมูลสินค้าและกระบวนการสั่งซื้อ

### ขอบเขตการดำเนินงาน 
  ขอบเขตการทำงานของระบบได้ถูกกำหนดอย่างชัดเจนเพื่อครอบคลุมทุกด้านของการทำธุรกิจ E-commerce:
  1. ส่วนของผู้ใช้งาน (Frontend Features)
การยืนยันตัวตน: สมัครสมาชิก, เข้าสู่ระบบด้วย JWT, จัดการโปรไฟล์
การเลือกซื้อ: ค้นหา, กรองสินค้าตามหมวดหมู่, ดูรายละเอียดสินค้า, และใช้ระบบ ตะกร้าสินค้าแบบ Real-time
การทำธุรกรรม: ดำเนินการสั่งซื้อ (Checkout), เลือกวิธีการชำระเงิน, และจัดการ ที่อยู่จัดส่ง (เพิ่ม/ลบ/แก้ไข/กำหนดที่อยู่หลัก)
ติดตามผล: ผู้ใช้สามารถ ติดตามสถานะคำสั่งซื้อ และดูใบเสร็จ (Invoice) ได้
  2. ส่วนของผู้ดูแลระบบ (Admin Features)
จัดการข้อมูลหลัก: จัดการสินค้า (เพิ่ม/ลบ/แก้ไข), หมวดหมู่, สต็อกสินค้า, และโปรโมชั่น
จัดการคำสั่งซื้อ: ตรวจสอบและอัปเดตสถานะคำสั่งซื้อทั้งหมดของลูกค้า
### เทคโนโลยีที่ใช้
  Frontend:	React.js
  Backend: Node.js(Express.js)
  Database:	MySQL
  Security:	JSON Web Tokens(JWT)

### ขั้นตอนการติดตั้งและใช้งาน 
  1. การเตรียมสภาพแวดล้อม 
     Node.js (พร้อม npm)
     MySQL Server (พร้อมโปรแกรมจัดการ เช่น XAMPP, phpMyAdmin)
     Git

  2. การติดตั้ง Backend (Node.js Server)
     2.1 Clone และติดตั้ง Dependencies
     
### Clone โปรเจกต์:
```
git clone https://github.com/Anndewx/toy-store-edit-main.git
cd toy-store-edit-main/backend
```
ติดตั้ง Dependencies:
```
npm install
```
### Database
```
  [Dowload SQL](https://github.com/Anndewx/toy-store-edit-main/raw/main/toy_store.sql)
```
### ตั้งค่า Environment Variables (.env)
สร้างไฟล์ .env ในโฟลเดอร์ backend และใส่รายละเอียดการเชื่อมต่อฐานข้อมูล:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password 
DB_NAME=toy_store_db
JWT_SECRET=your_secret_key_for_security
รัน Backend Server:
```
```
npm start
```
เซิร์ฟเวอร์จะทำงานที่ http://localhost:8081

### ติดตั้ง Frontend
เข้าสู่โฟลเดอร์ Frontend:
```
cd ..
cd frontend
```
ติดตั้ง Dependencies:
```
npm install
```
รัน Frontend Application:
```
npm start
```
เว็บไซต์จะเปิดขึ้นโดยอัตโนมัติที่ http://localhost:3000

คู่มือการใช้งาน: ขั้นตอนการใช้งานระบบพร้อมภาพประกอบหน้าจอทั้งหมดอยู่ในไฟล์ ภาคผนวก ก-ค.pdf (ในส่วนของภาคผนวก ค)
