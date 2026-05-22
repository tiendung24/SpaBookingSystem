# API Implementation Status

Tài liệu này đối chiếu `backend/docs/API_CATALOG.md` với mã nguồn hiện tại trong `backend/src/`.

## Quy ước trạng thái
- `DONE`: Đã có route + controller + query DB + logic nghiệp vụ cốt lõi chạy được.
- `BASIC`: Đã có route/controller và xử lý DB một phần, nhưng chưa đủ production hoặc còn phụ thuộc provider ngoài.
- `TODO`: Chưa code hoặc chỉ mới scaffold rất mỏng.

## 1) Public API

| Route | Trạng thái | Ghi chú |
|---|---|---|
| `GET /api/public/shops/:slug` | DONE | Lấy shop theo slug |
| `GET /api/public/shops/:slug/status` | DONE | Trả trạng thái + khả năng nhận lịch |
| `GET /api/public/shops/:slug/service-categories` | DONE | Lấy danh mục dịch vụ |
| `GET /api/public/shops/:slug/services` | DONE | Lấy danh sách dịch vụ |
| `GET /api/public/shops/:slug/services/:serviceId` | DONE | Lấy chi tiết dịch vụ |
| `GET /api/public/shops/:slug/staffs` | DONE | Lấy staff |
| `GET /api/public/shops/:slug/available-slots` | BASIC | Có slot theo giờ làm, capacity, staff; chưa xử lý break/special-case nâng cao |
| `POST /api/public/shops/:slug/bookings` | DONE | Có transaction + slot lock theo staff, tạo payment + deposit |
| `GET /api/public/bookings/:bookingCode` | DONE | Tra cứu booking |
| `POST /api/public/bookings/:bookingCode/cancel` | BASIC | Có cancel window + refund eligibility cơ bản |
| `POST /api/public/bookings/:bookingCode/refund-info` | DONE | Tạo refund request |
| `GET /api/public/bookings/:bookingCode/refund-status` | DONE | Xem refund status |
| `POST /api/public/bookings/:bookingCode/report-shop-fraud` | DONE | Tạo fraud report |
| `POST /api/public/bookings/:bookingCode/reviews` | DONE | Lưu review vào booking |

## 2) Shop API

### Auth / Profile / Dashboard
| Route | Trạng thái | Ghi chú |
|---|---|---|
| `POST /api/auth/shop/register` | DONE | Tạo user + shop |
| `POST /api/auth/shop/login` | DONE | Login shop, trả JWT |
| `GET /api/auth/me` | DONE | Có auth middleware |
| `PUT /api/auth/change-password` | DONE | Đổi password |
| `GET /api/shops/me` | DONE | Alias theo spec |
| `PUT /api/shops/me` | DONE | Update profile shop |
| `GET /api/shop/dashboard/*` | DONE | Dashboard cơ bản đủ dùng |

### Dịch vụ / Nhân viên / Lịch làm việc
| Route | Trạng thái | Ghi chú |
|---|---|---|
| Tất cả `service-categories` | DONE | CRUD đủ |
| Tất cả `services` | DONE | CRUD + status |
| Tất cả `staffs` | DONE | CRUD + status |
| Tất cả `working-hours` / `holiday-settings` / `slot-settings` | DONE | CRUD đủ |

### Booking
| Route | Trạng thái | Ghi chú |
|---|---|---|
| `GET /api/shop/bookings` | DONE | List/filter cơ bản |
| `GET /api/shop/bookings/:bookingId` | DONE | Detail |
| `PUT /confirm` | DONE | Có state transition |
| `PUT /cancel` | BASIC | Có refund_pending + giải phóng slot lock |
| `PUT /check-in` | DONE | Có state transition |
| `PUT /check-out` | BASIC | Có auto release escrow + platform fee |
| `PUT /no-show` | BASIC | Có auto split escrow theo setting |
| `PUT /note` | DONE | Update note |

### Ví / Giao dịch
| Route | Trạng thái | Ghi chú |
|---|---|---|
| `GET /api/shop/wallet` | DONE | Xem ví |
| `GET /api/shop/wallet/transactions` | DONE | Lịch sử ví |
| `POST /api/shop/wallet/topup/create` | BASIC | Tạo PayOS payment link thật |
| `GET /api/shop/wallet/topup/:topupId/status` | BASIC | Đọc DB status |
| `GET/PUT /api/shop/deposit-settings` | DONE | Config cọc |
| `GET /api/shop/platform-fees` | DONE | Phí nền tảng |
| `GET /api/shop/transactions` | BASIC | Gộp transaction cơ bản |
| `GET /api/shop/transactions/:transactionId` | BASIC | Chi tiết transaction cơ bản |

### Notifications / Reviews / Upload
| Route | Trạng thái | Ghi chú |
|---|---|---|
| `GET/PUT /api/shop/notifications*` | DONE | Đọc thông báo |
| `GET /api/shop/reviews` | DONE | Lấy reviews |
| `GET /api/shop/cancel-reasons/statistics` | DONE | Aggregate |
| `POST /api/uploads/image` | DONE | Upload base64 -> local filesystem |
| `DELETE /api/uploads/:fileId` | DONE | Xóa file local |

## 3) Admin API

| Route nhóm | Trạng thái | Ghi chú |
|---|---|---|
| `POST /api/auth/admin/login` | DONE | Login admin |
| `/api/admin/dashboard/*` | DONE | Dashboard cơ bản |
| `/api/admin/shops*` | DONE | Shop management |
| `/api/admin/bookings*` | BASIC | Có list/detail/status/payment/escrow |
| `/api/admin/wallets*` | DONE | Wallets + adjust |
| `/api/admin/wallet-transactions` | DONE | Có |
| `/api/admin/transactions*` | DONE | Gộp wallet tx + platform fees + payos payments + deposits |
| `/api/admin/platform-fees*` | DONE | Aggregate cơ bản |
| `/api/admin/refunds*` | DONE | Refund flow DB |
| `/api/admin/escrows*` | BASIC | Release/refund/split có logic DB; chưa external payout/refund thật |
| `/api/admin/fraud-reports*` | BASIC | Có approve/reject; chưa reward customer tự động |
| `/api/system/fraud/check-cancel-rate` | DONE | Có |
| `/api/system/fraud/auto-lock-shops` | BASIC | Có logic + cron scan; chưa full job orchestration |
| `/api/admin/notifications*` | BASIC | DB broadcast + adapter channels; chưa provider thật |
| `/api/admin/settings*` | DONE | CRUD key-value settings |

## 4) Integrations

| Route | Trạng thái | Ghi chú |
|---|---|---|
| `POST /api/webhooks/payos` | BASIC | Verify + idempotency escrow_hold; cần webhook URL deploy để chạy live |
| `POST /api/notifications/send-email` | BASIC | Có adapter service + audit outbox; chờ provider thật |

## 5) Hạ tầng / Hardening đã có

- JWT auth cho shop/admin
- MongoDB models + config DB `SpaBooking`
- Slot lock giảm race-condition khi đặt lịch
- Audit log cho các action quan trọng
- Cron jobs cơ bản:
  - fraud auto-lock scan
  - refund queue scan
  - booking reminder scan
- Swagger UI + schema cho các API chính

## 6) Còn thiếu để production hoàn chỉnh

- Provider thật cho Email
- Webhook URL deploy thật cho PayOS
- Atomicity/idempotency sâu hơn cho toàn bộ flow tiền
- Reward customer tự động khi approve fraud report
- Reminder notifications gửi thật (không chỉ audit scan)
- Swagger schema phủ 100% request/response chi tiết cho mọi route
