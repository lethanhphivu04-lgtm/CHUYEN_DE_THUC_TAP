# HITU MARKET — Tiến Độ Thực Hiện

> File này được agent đọc tự động để biết cần làm gì tiếp theo.
> `[x]` = đã hoàn thành, `[/]` = đang làm, `[ ]` = chưa làm.

---

## Phase 1: Hoàn thiện Module Cốt lõi

- [x] 1.1 Admin Category CRUD (frontend gọi categoryService, hiển thị cây danh mục, thêm/sửa/xóa)
- [x] 1.2 Admin Product Management (frontend bảng sản phẩm, filter, xem chi tiết, xóa)
- [x] 1.3 Product Detail Page (đã hoàn thiện gallery, SKU selector, add to cart API)
- [x] 1.4 Homepage với dữ liệu thật (gọi productService, hiển thị SP mới nhất, danh mục pills)

## Phase 2: Giỏ hàng & Đặt hàng (Module 3 + 5)

- [x] 2.1 Backend: Cart + CartItem entities
- [x] 2.2 Backend: Order + SubOrder + OrderItem + OrderStatusHistory entities
- [x] 2.3 Backend: Migration AddCartAndOrderSchema
- [x] 2.4 Backend: CartsController (CRUD giỏ hàng, kiểm tra tồn kho, chặn seller tự mua hàng)
- [x] 2.5 Backend: OrdersController (checkout tách đơn theo seller, lịch sử, hủy đơn, cập nhật trạng thái)
- [x] 2.6 Frontend: Cart page (danh sách theo seller, +/- số lượng, xóa, tổng tiền)
- [x] 2.7 Frontend: Checkout page (chọn địa chỉ, phương thức TT, xác nhận)
- [x] 2.8 Frontend: Order history + timeline trạng thái (/profile/orders)

## Phase 3: Thanh toán (Module 4)

- [x] 3.1 Backend: Payment + PaymentLog entities + migration
- [x] 3.2 Backend: PaymentsController (COD, VNPay callback)
- [x] 3.3 Frontend: Tích hợp payment vào checkout

## Phase 4: Quản lý Người bán (Module 6)

- [x] 4.1 Backend: SellerWallet + WalletTransaction + WithdrawalRequest entities
- [x] 4.2 Backend: SellersController (đăng ký, CRUD SP, xem đơn, dashboard)
- [x] 4.3 Frontend: Admin duyệt seller
- [x] 4.4 Frontend: Seller dashboard + CRUD sản phẩm + xử lý đơn

## Phase 5: Admin Nâng Cao (Module 11)

- [x] 5.1 Backend: Admin endpoints (user management, stats, audit log)
- [x] 5.2 Frontend: Admin user CRUD thật (lock/unlock, phân vai trò)
- [x] 5.3 Frontend: Admin dashboard thật (thống kê realtime)
- [x] 5.4 Frontend: Admin order management

## Phase 6: Mở rộng (Modules 7, 8, 9)

- [x] 6.1 Voucher system (backend)
- [x] 6.1.1 Frontend: Áp dụng Voucher khi đặt hàng & Admin quản lý mã giảm giá
- [x] 6.2 Product Reviews & Ratings (backend)
- [x] 6.2.1 Frontend: Viết đánh giá sản phẩm đã giao & Thống kê sao trang chi tiết
- [x] 6.3 Wishlist (backend)
- [x] 6.4 Returns & Refunds (backend)

## Phase 7: Thông báo & Nội dung (Module 10, 11)

- [x] 7.1 In-app Notifications (backend)
- [x] 7.2 Email notifications (đơn hàng, OTP)
- [x] 7.3 Banner management (backend)
- [x] 7.4 Blog/Posts (backend)

## Phase 8: Chatbot & Polish (Module 12)

- [x] 8.1 Chatbot Gemini AI integration (backend)
- [x] 8.2 Autocomplete search (backend)
- [x] 8.3 UI/UX polish toàn bộ (Tích hợp Trợ lý AI Gemini widget, tối ưu UI/UX)
