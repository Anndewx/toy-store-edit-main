# server/Dockerfile
FROM node:20-bullseye-slim

WORKDIR /app/server

# 1) copy เฉพาะไฟล์ package* เพื่อให้ layer cache ได้
COPY server/package*.json ./

# 2) ติดตั้ง deps แบบสะอาดใน container
RUN npm ci --omit=dev

# 3) ค่อย copy โค้ดส่วนที่เหลือ
COPY server ./

ENV PORT=3001 HOST=0.0.0.0
EXPOSE 3001

# 4) เผื่อเคยพก node_modules มา ให้ “rebuild bcrypt” ให้ตรงสภาพแวดล้อม
RUN npm rebuild bcrypt --build-from-source || true

CMD ["npm","start"]
