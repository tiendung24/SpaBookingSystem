# DB Models (MongoDB: SpaBooking)

Tài liệu này mô tả mapping **collection JSON đã import** ↔ **Mongoose model**.

## Collections → Models

| Collection | Model | File |
|---|---|---|
| `shops` | `Shop` | `src/models/schemas/shop.model.js` |
| `users` | `User` | `src/models/schemas/user.model.js` |
| `service_categories` | `ServiceCategory` | `src/models/schemas/serviceCategory.model.js` |
| `services` | `Service` | `src/models/schemas/service.model.js` |
| `shop_staffs` | `ShopStaff` | `src/models/schemas/shopStaff.model.js` |
| `shop_working_hours` | `ShopWorkingHour` | `src/models/schemas/shopWorkingHour.model.js` |
| `shop_closure_days` | `ShopClosureDay` | `src/models/schemas/shopClosureDay.model.js` |
| `customers` | `Customer` | `src/models/schemas/customer.model.js` |
| `bookings` | `Booking` | `src/models/schemas/booking.model.js` |
| `booking_cancel_reasons` | `BookingCancelReason` | `src/models/schemas/bookingCancelReason.model.js` |
| `booking_status_logs` | `BookingStatusLog` | `src/models/schemas/bookingStatusLog.model.js` |
| `deposits` | `Deposit` | `src/models/schemas/deposit.model.js` |
| `payos_payments` | `PayosPayment` | `src/models/schemas/payosPayment.model.js` |
| `wallets` | `Wallet` | `src/models/schemas/wallet.model.js` |
| `wallet_transactions` | `WalletTransaction` | `src/models/schemas/walletTransaction.model.js` |
| `platform_fees` | `PlatformFee` | `src/models/schemas/platformFee.model.js` |
| `refund_requests` | `RefundRequest` | `src/models/schemas/refundRequest.model.js` |
| `fraud_reports` | `FraudReport` | `src/models/schemas/fraudReport.model.js` |
| `penalties` | `Penalty` | `src/models/schemas/penalty.model.js` |
| `shop_payouts` | `ShopPayout` | `src/models/schemas/shopPayout.model.js` |
| `notification_templates` | `NotificationTemplate` | `src/models/schemas/notificationTemplate.model.js` |
| `notifications` | `Notification` | `src/models/schemas/notification.model.js` |
| `system_settings` | `SystemSetting` | `src/models/schemas/systemSetting.model.js` |
| `audit_logs` | `AuditLog` | `src/models/schemas/auditLog.model.js` |

## Lưu ý về ObjectId

Dữ liệu JSON export từ MongoDB thường có dạng:
```json
{ "_id": { "$oid": "..." } }
```

Trong Mongoose, `_id` mặc định là ObjectId.  
Nếu bạn muốn “chuẩn hóa reference” cho các field `shopId`, `ownerId`, ... về ObjectId thật, mình sẽ refactor schema:
- `shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }`

Hiện tại mình để an toàn ở mức “string-like” + `strict:false` (ở `src/models/base.js`) để tránh fail do field phát sinh.

