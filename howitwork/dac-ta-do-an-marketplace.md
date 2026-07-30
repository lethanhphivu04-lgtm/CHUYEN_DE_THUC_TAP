# Đặc tả đồ án: Website Thương mại điện tử HITU MARKET (Sàn Marketplace đa người bán)

> File này dùng để theo dõi và cập nhật xuyên suốt quá trình làm đồ án. Mỗi module gồm: **Mô tả** (bài toán/nghiệp vụ), **Chức năng** (checklist để tick khi hoàn thành), **Mong muốn / Ghi chú** (ý tưởng, ràng buộc, điều muốn làm thêm — tự do chỉnh sửa).
>
> Cách dùng checklist: `- [ ]` chưa làm, `- [x]` đã xong.

---

## 0. Tổng quan

**Tên đề tài:** Xây dựng hệ thống website thương mại điện tử theo mô hình Marketplace đa người bán (HITU MARKET)

**Mô tả chung:** Sàn giao dịch trung gian cho phép nhiều người bán độc lập cùng kinh doanh trên một nền tảng chung. Khác với bán lẻ truyền thống, hệ thống phải quản lý đồng thời nhiều người bán, tách đơn hàng theo gian hàng, tính hoa hồng, xây dựng uy tín cho cả sản phẩm lẫn người bán, trong khi khách hàng vẫn có trải nghiệm mua sắm liền mạch.

**4 vai trò người dùng:** Khách vãng lai (Guest) · Thành viên (Member) · Người bán (Seller) · Quản trị viên (Admin)

**Tech stack:**

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core (.NET 9) Web API — Clean Architecture rút gọn / Modular Monolith |
| ORM | Entity Framework Core (Code First + Migration) |
| CSDL | SQL Server |
| Xác thực | ASP.NET Identity + JWT (Access Token + Refresh Token) |
| Frontend | Next.js (React) — SSR/SSG cho trang công khai, Client Components cho khu vực đăng nhập |
| CSS | Tailwind CSS |
| Gọi API | Axios + Fetch API tích hợp Next.js |
| Đăng nhập bên thứ 3 | Google OAuth 2.0 |
| Thanh toán | COD + VNPay/Momo |
| Email | Gmail SMTP |
| Trợ lý ảo | OpenAI API |
| Logging | Serilog |

**Phạm vi ưu tiên:**
- *Cốt lõi:* tài khoản & phân quyền, sản phẩm/danh mục, giỏ hàng & đặt hàng (tách đơn theo seller), thanh toán (COD + 1 cổng điện tử), quản lý người bán & duyệt gian hàng, quản trị cơ bản, email.
- *Mở rộng (tùy thời gian còn lại):* voucher, đổi trả/hoàn tiền, đánh giá & wishlist, chatbot, banner/tin tức.

---

## 1. Module Tài khoản & Xác thực

**Mô tả:** Quản lý định danh và phân quyền cho 4 nhóm vai trò có phạm vi truy cập khác nhau; đảm bảo xác thực stateless qua JWT.

**Chức năng:**
- [x] Đăng ký/đăng nhập bằng email
- [ ] Xác thực tài khoản qua OTP gửi Gmail
- [x] Đăng nhập cấp Access Token + Refresh Token
- [ ] Đăng xuất phiên hiện tại / toàn bộ thiết bị
- [ ] Khôi phục mật khẩu qua OTP
- [x] Quản lý hồ sơ cá nhân
- [x] Sổ địa chỉ giao hàng (nhiều địa chỉ, chọn mặc định)
- [x] Phân quyền 4 vai trò: Guest / Member / Seller / Admin
- [ ] Khóa tạm thời tài khoản khi đăng nhập sai quá số lần cho phép
- [ ] Đăng nhập Google OAuth 2.0

**Bảng CSDL:** Users, Roles, UserRoles, RefreshTokens, Addresses, OtpCodes, ExternalLogins

**Mong muốn / Ghi chú:**
-

---

## 2. Module Sản phẩm & Danh mục

**Mô tả:** Sản phẩm thuộc quyền sở hữu của từng người bán, hỗ trợ nhiều biến thể (SKU).

**Chức năng:**
- [x] CRUD sản phẩm, mỗi sản phẩm nhiều SKU (size, màu…) và nhiều ảnh
- [x] Quản lý danh mục dạng cây, nhiều cấp
- [x] Tìm kiếm theo từ khóa, lọc theo giá/danh mục
- [x] Sắp xếp: giá, mới nhất, bán chạy, đánh giá cao
- [x] Phân trang danh sách sản phẩm
- [ ] Sản phẩm liên quan/gợi ý cùng danh mục
- [ ] Autocomplete tìm kiếm theo thời gian thực
- [x] Trang chủ theo nhóm: mới nhất, khuyến mãi, theo danh mục
- [ ] Nhập sản phẩm/ảnh hàng loạt qua Excel

**Bảng CSDL:** Categories, Products, ProductSkus, ProductImages, ProductAttributes
> Ghi chú: tồn kho khả dụng = StockQuantity − ReservedQuantity

**Mong muốn / Ghi chú:**
-

---

## 3. Module Giỏ hàng & Đặt hàng

**Mô tả:** Giỏ hàng có thể chứa sản phẩm nhiều người bán — phải tách đúng thành các đơn hàng con (SubOrders) khi checkout, giữ một mã đơn hàng gốc để khách theo dõi thống nhất.

**Chức năng:**
- [x] CRUD sản phẩm trong giỏ (chỉ Member)
- [x] Kiểm tra tồn kho khả dụng khi thêm giỏ và khi đặt hàng
- [x] Checkout: chọn địa chỉ, phương thức vận chuyển, phương thức thanh toán
- [x] Tự động tách đơn theo từng người bán khi checkout
- [x] Tự động điền địa chỉ từ hồ sơ cá nhân
- [ ] Áp dụng voucher tại bước checkout

**Bảng CSDL:** Carts, CartItems, Orders, SubOrders, OrderItems, OrderStatusHistories
> Ghi chú: PriceSnapshot, AddressSnapshot lưu giá/địa chỉ tại thời điểm đặt hàng, không bị ảnh hưởng khi dữ liệu gốc đổi sau này.

**Mong muốn / Ghi chú:**
-

---

## 4. Module Thanh toán

**Mô tả:** Hỗ trợ COD và cổng thanh toán điện tử; trạng thái thanh toán độc lập với trạng thái vận chuyển.

**Chức năng:**
- [x] Thanh toán COD
- [ ] Thanh toán trực tuyến qua VNPay hoặc Momo
- [ ] Tự động hủy đơn & giải phóng tồn kho khi hết hạn thanh toán
- [ ] Ghi log đầy đủ giao dịch thanh toán
- [ ] Ví điện tử nội bộ ghi nhận số dư người bán

**Bảng CSDL:** Payments, PaymentLogs, SellerWallets, WalletTransactions, WithdrawalRequests

**Mong内部 / Ghi chú:**
-

---

## 5. Module Vận chuyển & Đơn hàng

**Mô tả:** Vòng đời trạng thái đơn hàng rút gọn, không cho phép chuyển trạng thái lùi.

**Chức năng:**
- [ ] Tính phí vận chuyển theo địa chỉ giao hàng
- [x] Vòng đời trạng thái rút gọn (Chờ xử lý → Đang giao → Đã giao / Đã hủy)
- [x] Timeline lịch sử thay đổi trạng thái đơn hàng
- [x] Khách hủy đơn trong khoảng thời gian quy định
- [ ] Người bán tự cập nhật trạng thái đơn hàng gian hàng mình

**Bảng CSDL:** dùng chung SubOrders, OrderStatusHistories (mục 3)

**Mong muốn / Ghi chú:**
-

---

## 6. Module Người bán (Seller)

**Mô tả:** Mỗi seller quản lý gian hàng, sản phẩm, đơn hàng trong phạm vi riêng, không truy cập dữ liệu seller khác. Sàn thu hoa hồng trên mỗi giao dịch.

**Chức năng:**
- [ ] Đăng ký gian hàng (tên, mô tả, logo)
- [ ] Admin duyệt/từ chối gian hàng
- [ ] CRUD sản phẩm thuộc gian hàng
- [ ] Xem & xử lý đơn hàng thuộc gian hàng
- [ ] Dashboard: doanh thu, đơn hàng theo trạng thái, sản phẩm bán chạy
- [x] Chặn seller mua sản phẩm của chính mình (kiểm tra ở Application layer)
- [ ] Tính hoa hồng theo %, gửi yêu cầu rút tiền
- [ ] Đánh giá riêng dành cho người bán

**Bảng CSDL:** Sellers, SellerReviews
> Ghi chú: Products.SellerId → Sellers.Id là điểm gắn kết chính giữa module Sản phẩm và module Người bán.

**Mong muốn / Ghi chú:**
-

---

## 7. Module Khuyến mãi & Voucher *(mở rộng)*

**Mô tả:** Voucher có thể áp dụng toàn sàn hoặc riêng theo từng seller.

**Chức năng:**
- [ ] Mã giảm theo %, số tiền cố định, hoặc miễn phí vận chuyển
- [ ] Điều kiện: giá trị đơn tối thiểu, giới hạn lượt dùng
- [ ] Kiểm tra hợp lệ tại thời điểm đặt hàng
- [ ] Voucher riêng theo từng seller (SellerId nullable = toàn sàn)

**Bảng CSDL:** Vouchers, VoucherUsages

**Mong muốn / Ghi chú:**
-

---

## 8. Module Đổi trả & Hoàn tiền *(mở rộng)*

**Mô tả:** Quy trình đổi trả có trạng thái riêng, hoàn tiền về đúng phương thức thanh toán gốc.

**Chức năng:**
- [ ] Yêu cầu đổi trả kèm lý do + hình ảnh minh chứng
- [ ] Trạng thái: Yêu cầu mới / Đang xem xét / Chấp nhận / Từ chối / Hoàn tất
- [ ] Hoàn tiền về đúng phương thức thanh toán gốc

**Bảng CSDL:** ReturnRequests, ReturnRequestImages

**Mong muốn / Ghi chú:**
-

---

## 9. Module Đánh giá & Wishlist *(mở rộng)*

**Mô tả:** Đánh giá chỉ dành cho khách đã mua thành công (xác thực qua OrderItemId).

**Chức năng:**
- [ ] Đánh giá sản phẩm: sao (1-5), nhận xét, ảnh/video
- [ ] Điểm đánh giá seller = trung bình cộng
- [ ] Admin ẩn/xóa đánh giá vi phạm
- [ ] Wishlist cho Member

**Bảng CSDL:** ProductReviews, ProductReviewImages, Wishlists

**Mong muốn / Ghi chú:**
-

---

## 10. Module Thông báo

**Mô tả:** Kênh thông báo qua email và trong hệ thống.

**Chức năng:**
- [ ] Email xác nhận đặt hàng / hủy đơn
- [ ] Thông báo trong hệ thống (chuông thông báo)
- [ ] Email cho sự kiện quan trọng: OTP, kết quả duyệt gian hàng, kết quả hoàn tiền

**Bảng CSDL:** Notifications, EmailLogs

**Mong muốn / Ghi chú:**
-

---

## 11. Module Quản trị (Admin)

**Mô tả:** Quản lý toàn hệ thống; Admin không sở hữu gian hàng và không bán hàng.

**Chức năng:**
- [ ] Quản lý tài khoản, khóa/mở khóa
- [ ] Duyệt người bán, duyệt sản phẩm (nếu áp dụng kiểm duyệt)
- [x] Quản lý danh mục sản phẩm
- [ ] Báo cáo: doanh thu, đơn hàng theo trạng thái, tồn kho thấp
- [ ] Audit log các thao tác nhạy cảm
- [ ] Quản lý banner quảng cáo
- [ ] Quản lý tin tức/blog

**Bảng CSDL:** AuditLogs, Banners, Posts, PostCategories

**Mong muốn / Ghi chú:**
-

---

## 12. Module Trợ lý ảo / Chatbot *(mở rộng)*

**Mô tả:** Tư vấn sản phẩm dựa trên OpenAI API, có truy xuất ngữ cảnh sản phẩm liên quan trước khi gửi cho model.

**Chức năng:**
- [ ] Trả lời câu hỏi cơ bản của khách hàng
- [ ] Gợi ý sản phẩm dựa trên nội dung câu hỏi

**Bảng CSDL:** ChatConversations, ChatMessages

**Mong muốn / Ghi chú:**
-

---

## 13. Vấn đề kỹ thuật cần giải quyết (tổng hợp)

- [x] Xác thực & phân quyền 4 nhóm đối tượng có phạm vi truy cập khác nhau
- [x] Mô hình dữ liệu sản phẩm hỗ trợ SKU, gắn đúng quyền sở hữu theo seller
- [x] Luồng đặt hàng tách đơn theo seller, nhất quán dữ liệu tồn kho/đơn hàng/thanh toán
- [x] Vòng đời trạng thái đơn hàng không cho phép chuyển lùi
- [ ] Xử lý thanh toán thất bại/hết hạn không làm sai lệch tồn kho
- [ ] Cơ chế ví nội bộ + yêu cầu rút tiền cho seller
- [ ] Ghi log mọi thao tác nhạy cảm phục vụ truy vết/đối soát

---

## 14. Nhật ký cập nhật

| Ngày | Nội dung cập nhật |
|---|---|
| 2026-07-30 | Khởi tạo file đặc tả từ báo cáo đồ án |
| 2026-07-30 | Hoàn thành Phase 1 & Phase 2: Category Admin, Product Admin, Real Homepage, Full Cart & Multi-seller Checkout Order system, Order history with status timeline |

