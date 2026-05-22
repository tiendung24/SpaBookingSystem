# Backend Structure

## Thư mục chính

```text
backend/
  src/
    config/           # DB, env config
    controllers/      # Request handlers theo domain
    middlewares/      # Error handler, auth middleware (bổ sung sau)
    models/           # Mongoose schemas/models
    routes/           # Router theo module
services/         # Integrations (PayOS, Email...)
    swagger/          # Swagger setup
    utils/            # helper chung
    server.js         # app bootstrap
```

## Luồng request tiêu chuẩn

`Route -> Controller -> Service -> Model`

Ví dụ:
1. `POST /api/public/shops/:slug/bookings`
2. `public/shops.controller.createBooking`
3. `PayOSService.createDepositPayment`
4. `Booking` + `PayosPayment` + `Notification` models (khi nối DB thật)

## Nguyên tắc mở rộng

1. **Không nhét logic vào route**
   - route chỉ nên map endpoint -> controller
2. **Controller mỏng**
   - validate input + gọi service + trả response
3. **Service chịu trách nhiệm business logic**
4. **Model giữ schema/index + query**
5. **Response format thống nhất**
   - `success/data/meta` hoặc `message/errors`
