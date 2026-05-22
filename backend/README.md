# LumiX Backend (Node.js + Swagger + PayOS + Zalo)

## 1) Cài đặt
```bash
cd backend
npm install
```

## 2) Chạy dev
```bash
npm run dev
```

## 3) Swagger
- Swagger UI: `http://localhost:4000/api/docs`
- JSON: `http://localhost:4000/api/docs.json`

## 4) Env
Copy file env mẫu:
```bash
copy .env.example .env
```

## 5) Ghi chú
- Đây là skeleton backend: đã có route/controller/service theo API bạn chốt.
- PayOS/Zalo mới là “khung tích hợp”, chưa gọi API thật (để tránh nhầm key/flow). Khi bạn có key thật, mình sẽ nối đầy đủ.

