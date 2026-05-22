# LumiX API Catalog (Backend)

Tài liệu chuẩn endpoint cho backend theo 3 vai trò:
- Public API (khách hàng)
- Shop API (chủ shop)
- Admin API (LumiX admin)

## 1) Public API — Khách hàng đặt lịch
| Chức năng | Method | Route |
|---|---|---|
| Xem trang shop | GET | `/api/public/shops/:slug` |
| Xem trạng thái shop | GET | `/api/public/shops/:slug/status` |
| Xem danh mục dịch vụ | GET | `/api/public/shops/:slug/service-categories` |
| Xem dịch vụ | GET | `/api/public/shops/:slug/services` |
| Xem chi tiết dịch vụ | GET | `/api/public/shops/:slug/services/:serviceId` |
| Xem nhân viên | GET | `/api/public/shops/:slug/staffs` |
| Xem slot trống | GET | `/api/public/shops/:slug/available-slots` |
| Tạo booking | POST | `/api/public/shops/:slug/bookings` |
| Xem chi tiết booking | GET | `/api/public/bookings/:bookingCode` |
| Hủy lịch | POST | `/api/public/bookings/:bookingCode/cancel` |
| Nhập thông tin hoàn tiền | POST | `/api/public/bookings/:bookingCode/refund-info` |
| Xem trạng thái hoàn tiền | GET | `/api/public/bookings/:bookingCode/refund-status` |
| Tố giác shop gian lận | POST | `/api/public/bookings/:bookingCode/report-shop-fraud` |
| Đánh giá sau dịch vụ | POST | `/api/public/bookings/:bookingCode/reviews` |

## 2) Shop API — Chủ shop
### 2.0 Auth + Profile + Dashboard
| Chức năng | Method | Route |
|---|---|---|
| Đăng ký shop | POST | `/api/auth/shop/register` |
| Đăng nhập shop | POST | `/api/auth/shop/login` |
| Lấy thông tin tài khoản | GET | `/api/auth/me` |
| Đổi mật khẩu | PUT | `/api/auth/change-password` |
| Xem hồ sơ shop | GET | `/api/shops/me` |
| Cập nhật hồ sơ shop | PUT | `/api/shops/me` |
| Xem dashboard | GET | `/api/shop/dashboard/overview` |
| Booking hôm nay | GET | `/api/shop/dashboard/today-bookings` |
| Thống kê doanh thu | GET | `/api/shop/dashboard/revenue` |
| Thống kê tỷ lệ hủy | GET | `/api/shop/dashboard/cancel-rate` |
| Dịch vụ nổi bật | GET | `/api/shop/dashboard/top-services` |
| Nhân viên nổi bật | GET | `/api/shop/dashboard/top-staffs` |

### 2.1 Quản lý dịch vụ
| Chức năng | Method | Route |
|---|---|---|
| Xem danh mục dịch vụ | GET | `/api/shop/service-categories` |
| Tạo danh mục | POST | `/api/shop/service-categories` |
| Sửa danh mục | PUT | `/api/shop/service-categories/:categoryId` |
| Xóa danh mục | DELETE | `/api/shop/service-categories/:categoryId` |
| Xem dịch vụ | GET | `/api/shop/services` |
| Thêm dịch vụ | POST | `/api/shop/services` |
| Xem chi tiết dịch vụ | GET | `/api/shop/services/:serviceId` |
| Sửa dịch vụ | PUT | `/api/shop/services/:serviceId` |
| Xóa dịch vụ | DELETE | `/api/shop/services/:serviceId` |
| Bật/tắt dịch vụ | PUT | `/api/shop/services/:serviceId/status` |

### 2.2 Quản lý nhân viên
| Chức năng | Method | Route |
|---|---|---|
| Xem nhân viên | GET | `/api/shop/staffs` |
| Thêm nhân viên | POST | `/api/shop/staffs` |
| Xem chi tiết nhân viên | GET | `/api/shop/staffs/:staffId` |
| Sửa nhân viên | PUT | `/api/shop/staffs/:staffId` |
| Xóa nhân viên | DELETE | `/api/shop/staffs/:staffId` |
| Bật/tắt nhân viên | PUT | `/api/shop/staffs/:staffId/status` |

### 2.3 Cấu hình lịch làm việc
| Chức năng | Method | Route |
|---|---|---|
| Xem giờ làm việc | GET | `/api/shop/working-hours` |
| Cập nhật giờ làm việc | PUT | `/api/shop/working-hours` |
| Xem ngày nghỉ | GET | `/api/shop/holiday-settings` |
| Thêm ngày nghỉ | POST | `/api/shop/holiday-settings` |
| Xóa ngày nghỉ | DELETE | `/api/shop/holiday-settings/:holidayId` |
| Xem cấu hình slot | GET | `/api/shop/slot-settings` |
| Sửa cấu hình slot | PUT | `/api/shop/slot-settings` |

### 2.4 Quản lý booking
| Chức năng | Method | Route |
|---|---|---|
| Xem danh sách booking | GET | `/api/shop/bookings` |
| Xem chi tiết booking | GET | `/api/shop/bookings/:bookingId` |
| Xác nhận booking | PUT | `/api/shop/bookings/:bookingId/confirm` |
| Hủy booking | PUT | `/api/shop/bookings/:bookingId/cancel` |
| Check-in | PUT | `/api/shop/bookings/:bookingId/check-in` |
| Check-out | PUT | `/api/shop/bookings/:bookingId/check-out` |
| Đánh dấu no-show | PUT | `/api/shop/bookings/:bookingId/no-show` |
| Ghi chú booking | PUT | `/api/shop/bookings/:bookingId/note` |

### 2.5 Ví, cọc, giao dịch
| Chức năng | Method | Route |
|---|---|---|
| Xem ví shop | GET | `/api/shop/wallet` |
| Xem lịch sử ví | GET | `/api/shop/wallet/transactions` |
| Tạo giao dịch nạp ví | POST | `/api/shop/wallet/topup/create` |
| Kiểm tra nạp ví | GET | `/api/shop/wallet/topup/:topupId/status` |
| Xem cấu hình cọc | GET | `/api/shop/deposit-settings` |
| Cập nhật cấu hình cọc | PUT | `/api/shop/deposit-settings` |
| Xem phí nền tảng | GET | `/api/shop/platform-fees` |
| Xem giao dịch | GET | `/api/shop/transactions` |
| Xem chi tiết giao dịch | GET | `/api/shop/transactions/:transactionId` |

### 2.6 Thông báo, đánh giá, upload
| Chức năng | Method | Route |
|---|---|---|
| Xem thông báo | GET | `/api/shop/notifications` |
| Đọc một thông báo | PUT | `/api/shop/notifications/:notificationId/read` |
| Đọc tất cả thông báo | PUT | `/api/shop/notifications/read-all` |
| Xem đánh giá | GET | `/api/shop/reviews` |
| Thống kê lý do hủy | GET | `/api/shop/cancel-reasons/statistics` |
| Upload ảnh | POST | `/api/uploads/image` |
| Xóa ảnh | DELETE | `/api/uploads/:fileId` |

## 3) Admin API — LumiX Admin
### 3.0 Dashboard
| Chức năng | Method | Route |
|---|---|---|
| Đăng nhập admin | POST | `/api/auth/admin/login` |
| Dashboard tổng quan | GET | `/api/admin/dashboard/overview` |
| Thống kê doanh thu | GET | `/api/admin/dashboard/revenue` |
| Thống kê booking | GET | `/api/admin/dashboard/bookings` |
| Thống kê nạp ví | GET | `/api/admin/dashboard/wallet-topups` |
| Refund chờ xử lý | GET | `/api/admin/dashboard/pending-refunds` |
| Báo cáo gian lận | GET | `/api/admin/dashboard/fraud-reports` |
| Shop bị khóa | GET | `/api/admin/dashboard/locked-shops` |

### 3.1 Quản lý shop
| Chức năng | Method | Route |
|---|---|---|
| Xem danh sách shop | GET | `/api/admin/shops` |
| Xem chi tiết shop | GET | `/api/admin/shops/:shopId` |
| Khóa shop | PUT | `/api/admin/shops/:shopId/lock` |
| Mở khóa shop | PUT | `/api/admin/shops/:shopId/unlock` |
| Đổi trạng thái shop | PUT | `/api/admin/shops/:shopId/status` |
| Xem booking của shop | GET | `/api/admin/shops/:shopId/bookings` |
| Xem ví shop | GET | `/api/admin/shops/:shopId/wallet` |
| Xem giao dịch shop | GET | `/api/admin/shops/:shopId/transactions` |
| Xem thống kê shop | GET | `/api/admin/shops/:shopId/statistics` |

### 3.2 Quản lý booking
| Chức năng | Method | Route |
|---|---|---|
| Xem tất cả booking | GET | `/api/admin/bookings` |
| Xem chi tiết booking | GET | `/api/admin/bookings/:bookingId` |
| Cập nhật trạng thái booking | PUT | `/api/admin/bookings/:bookingId/status` |
| Xem payment booking | GET | `/api/admin/bookings/:bookingId/payments` |
| Xem escrow booking | GET | `/api/admin/bookings/:bookingId/escrow` |

### 3.3 Ví, giao dịch, PayOS
| Chức năng | Method | Route |
|---|---|---|
| Xem tất cả ví shop | GET | `/api/admin/wallets` |
| Xem ví một shop | GET | `/api/admin/wallets/:shopId` |
| Điều chỉnh số dư | POST | `/api/admin/wallets/:shopId/adjust` |
| Xem giao dịch ví | GET | `/api/admin/wallet-transactions` |
| Xem tất cả giao dịch | GET | `/api/admin/transactions` |
| Xem chi tiết giao dịch | GET | `/api/admin/transactions/:transactionId` |
| Xem phí nền tảng | GET | `/api/admin/platform-fees` |
| Thống kê phí nền tảng | GET | `/api/admin/platform-fees/statistics` |
| Webhook PayOS | POST | `/api/webhooks/payos` |

### 3.4 Refund + Escrow
| Chức năng | Method | Route |
|---|---|---|
| Xem danh sách refund | GET | `/api/admin/refunds` |
| Xem chi tiết refund | GET | `/api/admin/refunds/:refundId` |
| Chuyển sang đang xử lý | PUT | `/api/admin/refunds/:refundId/processing` |
| Đánh dấu hoàn thành | PUT | `/api/admin/refunds/:refundId/success` |
| Đánh dấu thất bại | PUT | `/api/admin/refunds/:refundId/failed` |
| Xem escrow | GET | `/api/admin/escrows` |
| Xem escrow theo booking | GET | `/api/admin/escrows/:bookingId` |
| Chuyển cọc cho shop | PUT | `/api/admin/escrows/:bookingId/release-to-shop` |
| Hoàn cọc cho khách | PUT | `/api/admin/escrows/:bookingId/refund-to-customer` |
| Chia tiền no-show | PUT | `/api/admin/escrows/:bookingId/split-no-show` |

### 3.5 Chống gian lận
| Chức năng | Method | Route |
|---|---|---|
| Xem tố giác | GET | `/api/admin/fraud-reports` |
| Xem chi tiết tố giác | GET | `/api/admin/fraud-reports/:reportId` |
| Duyệt tố giác | PUT | `/api/admin/fraud-reports/:reportId/approve` |
| Từ chối tố giác | PUT | `/api/admin/fraud-reports/:reportId/reject` |
| Kiểm tra tỷ lệ hủy | POST | `/api/system/fraud/check-cancel-rate` |
| Tự động khóa shop | POST | `/api/system/fraud/auto-lock-shops` |

### 3.6 Thông báo + cài đặt hệ thống
| Chức năng | Method | Route |
|---|---|---|
| Xem thông báo admin | GET | `/api/admin/notifications` |
| Gửi thông báo | POST | `/api/admin/notifications/send` |
| Gửi Email | POST | `/api/notifications/send-email` |
| Xem settings | GET | `/api/admin/settings` |
| Cập nhật settings | PUT | `/api/admin/settings` |

## Ghi chú
- Swagger endpoint:
  - `GET /api/docs` (UI)
  - `GET /api/docs.json` (OpenAPI JSON)
- Các tích hợp (PayOS/Email) cần cấu hình `.env` để chạy production.
