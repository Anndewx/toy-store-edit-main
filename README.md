#ระบบจัดการเว็บไซต์ขายของเล่นเพื่อการพาณิชย์ออนไลน์(Web-based Platform for Online Toys Sales Management)
##พัฒนาโดย: นายอัครพนธ์ และ นายศรัณย์กร 
###บทนำ
  โปรเจกต์นี้คือการพัฒนาระบบ E-commerce Platform สำหรับธุรกิจขายของเล่นออนไลน์ โดยมีเป้าหมายหลักคือการสร้างแพลตฟอร์มที่มีความ ปลอดภัย (ใช้ JWT), มี ประสิทธิภาพสูง, และมีระบบจัดการหลังบ้านที่สามารถ วิเคราะห์ข้อมูลยอดขาย ได้อย่างแม่นยำ ระบบนี้มุ่งเน้นการสร้างประสบการณ์ที่ดีให้กับผู้ใช้งานและอำนวยความสะดวกในการบริหารจัดการสินค้าและคำสั่งซื้อทั้งหมด

###วัตถุประสงค์หลัก
  1. เพื่อพัฒนาระบบเว็บไซต์ขายของเล่นออนไลน์ให้มี ประสิทธิภาพและมีความปลอดภัย
  2. เพื่อออกแบบระบบจัดการสินค้า คำสั่งซื้อ และข้อมูลลูกค้าสำหรับผู้ดูแลระบบ
  3. เพื่อศึกษาและประยุกต์ใช้ เทคโนโลยีเว็บสมัยใหม่ (React.js, Node.js) ในการพัฒนาเว็บไซต์ E-commerce
  4. เพื่อเพิ่มความสะดวกให้กับผู้ใช้งานในการเข้าถึงข้อมูลสินค้าและกระบวนการสั่งซื้อ

###ขอบเขตการดำเนินงาน 
  ขอบเขตการทำงานของระบบได้ถูกกำหนดอย่างชัดเจนเพื่อครอบคลุมทุกด้านของการทำธุรกิจ E-commerce:
  1. ส่วนของผู้ใช้งาน (Frontend Features)
การยืนยันตัวตน: สมัครสมาชิก, เข้าสู่ระบบด้วย JWT, จัดการโปรไฟล์
การเลือกซื้อ: ค้นหา, กรองสินค้าตามหมวดหมู่, ดูรายละเอียดสินค้า, และใช้ระบบ ตะกร้าสินค้าแบบ Real-time
การทำธุรกรรม: ดำเนินการสั่งซื้อ (Checkout), เลือกวิธีการชำระเงิน, และจัดการ ที่อยู่จัดส่ง (เพิ่ม/ลบ/แก้ไข/กำหนดที่อยู่หลัก)
ติดตามผล: ผู้ใช้สามารถ ติดตามสถานะคำสั่งซื้อ และดูใบเสร็จ (Invoice) ได้
  2. ส่วนของผู้ดูแลระบบ (Admin Features)
จัดการข้อมูลหลัก: จัดการสินค้า (เพิ่ม/ลบ/แก้ไข), หมวดหมู่, สต็อกสินค้า, และโปรโมชั่น
จัดการคำสั่งซื้อ: ตรวจสอบและอัปเดตสถานะคำสั่งซื้อทั้งหมดของลูกค้า
###เทคโนโลยีที่ใช้
  Frontend:	React.js
  Backend: Node.js(Express.js)
  Database:	MySQL
  Security:	JSON Web Tokens(JWT)

###ขั้นตอนการติดตั้งและใช้งาน 
  1. การเตรียมสภาพแวดล้อม 
     Node.js (พร้อม npm)
     MySQL Server (พร้อมโปรแกรมจัดการ เช่น XAMPP, phpMyAdmin)
     Git

  2. การติดตั้ง Backend (Node.js Server)
     2.1 Clone และติดตั้ง Dependencies
     
###Clone โปรเจกต์:
```
git clone https://github.com/Anndewx/toy-store-edit-main.git
cd toy-store-edit-main/backend
```
ติดตั้ง Dependencies:
```
npm install
```
2.2 ตั้งค่าฐานข้อมูล MySQL (สำคัญ)
สร้างฐานข้อมูลชื่อ toy_store_db
SQL
###1. ตาราง users: ข้อมูลผู้ใช้งานระบบ
```
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE, 
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
###2. ตาราง categories: หมวดหมู่สินค้า
```
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE 
);
```
###3. ตาราง products: ข้อมูลสินค้า
```
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    is_promotion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) 
);
```
###4. ตาราง addresses: ที่อยู่จัดส่งของผู้ใช้
```
CREATE TABLE addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255),
    district VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```
###5. ตาราง orders: บันทึกคำสั่งซื้อ
```
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    shipping_address_id BIGINT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Processing',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id)
);
```
###6. ตาราง order_items: รายละเอียดสินค้าในคำสั่งซื้อ
```
CREATE TABLE order_items (
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```
###2.3ตั้งค่า Environment Variables (.env)
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

###3. ติดตั้ง Frontend
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
