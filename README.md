# HITU MARKET - Website Thương Mại Điện Tử Marketplace Đa Người Bán

Chào mừng bạn đến với **HITU MARKET** - Hệ thống sàn thương mại điện tử theo mô hình Marketplace đa người bán. Đây là sàn giao dịch trung gian kết nối nhiều người bán độc lập (Sellers) với khách hàng, hỗ trợ quản lý gian hàng, tách đơn hàng tự động khi thanh toán, và các chức năng quản trị toàn diện.

---

## 🌟 Tổng Quan Dự Án

- **Tên dự án:** HITU MARKET
- **Mô tả:** Nền tảng thương mại điện tử đa người bán. Sàn giao dịch cho phép người dùng đăng ký gian hàng riêng, đăng bán sản phẩm và quản lý đơn hàng của họ. Hệ thống tự động phân tách đơn hàng (SubOrders) khi khách hàng thanh toán giỏ hàng chứa sản phẩm của nhiều shop khác nhau.
- **Đối tượng người dùng:**
  1. **Khách vãng lai (Guest):** Xem sản phẩm, tìm kiếm, đọc tin tức.
  2. **Thành viên (Member):** Quản lý giỏ hàng, đặt hàng, thanh toán, xem lịch sử đơn hàng, gửi đánh giá.
  3. **Người bán (Seller):** Quản lý gian hàng riêng, thêm/sửa/xóa sản phẩm, xử lý đơn hàng của shop, rút tiền từ ví nội bộ.
  4. **Quản trị viên (Admin):** Quản lý người dùng, duyệt gian hàng, duyệt danh mục sản phẩm, xem báo cáo doanh thu & thống kê toàn sàn.

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Framework:** ASP.NET Core (.NET 9) Web API - Thiết kế theo Clean Architecture rút gọn.
- **ORM & Database:** Entity Framework Core (Code First) với SQL Server.
- **Authentication/Authorization:** ASP.NET Identity + JWT (Access Token & Refresh Token) + Google OAuth 2.0.
- **Logging:** Serilog.
- **Thanh toán:** Tích hợp COD + Cổng thanh toán điện tử VNPay/Momo.
- **Email:** Gửi OTP và thông báo qua Gmail SMTP.
- **Trợ lý ảo:** Chatbot tích hợp OpenAI API tư vấn sản phẩm.

### Frontend
- **Framework:** Next.js (React) bản mới nhất.
- **Styling:** Tailwind CSS cho giao diện hiện đại, responsive mượt mà.
- **State & Data Fetching:** Axios kết hợp Fetch API mặc định của Next.js (hỗ trợ SSR & Client-side rendering).

---

## 📂 Cấu Trúc Dự Án (Project Structure)

Dự án được xây dựng dưới dạng Monorepo tiện lợi cho việc quản lý mã nguồn:

```text
HITU_MARKET/
├── backend/                  # Mã nguồn Backend (.NET 9 Web API)
│   ├── Marketplace.sln       # Solution file của Visual Studio
│   ├── Marketplace.API/      # Web API: Controllers, Configurations, Middlewares
│   ├── Marketplace.Core/     # Domain Entities, Interfaces, Business Logic
│   └── Marketplace.Infrastructure/ # Data Context (EF Core), Migrations, Services
├── frontend/                 # Mã nguồn Frontend (Next.js & Tailwind CSS)
│   ├── app/                  # Next.js App Router (Layouts & Pages)
│   │   ├── (site)/           # Các trang dành cho Khách hàng (Trang chủ, Giỏ hàng,...)
│   │   ├── (admin)/          # Các trang Quản lý Admin & Seller
│   │   └── _components/      # Reusable Components (Header, Footer, Sidebar,...)
│   ├── public/               # File tĩnh (Hình ảnh, Icons,...)
│   ├── package.json          # Quản lý dependencies frontend
│   └── next.config.mjs       # Cấu hình Next.js
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Cấu hình & Chạy Backend (ASP.NET Core API)

#### Yêu cầu:
- .NET 9 SDK
- SQL Server (LocalDB hoặc Express)

#### Các bước thực hiện:
1. Mở terminal và di chuyển vào thư mục `backend`:
   ```powershell
   cd backend
   ```
2. Cập nhật chuỗi kết nối CSDL và các thông số API Key trong `Marketplace.API/appsettings.json` (VNPay, Gemini AI, EmailSettings).
3. Chạy các Migration để tạo/cập nhật bảng CSDL:
   ```powershell
   dotnet ef database update --project Marketplace.Infrastructure --startup-project Marketplace.API
   ```
4. Khởi động ứng dụng Backend API:
   ```powershell
   dotnet run --project Marketplace.API
   ```
   *Lưu ý: API Swagger mở tại `http://localhost:5087/swagger` hoặc `https://localhost:7147/swagger`.*

---

### 2. Cấu hình & Chạy Frontend (Next.js)

#### Yêu cầu:
- Node.js (phiên bản 18 trở lên)
- npm

#### Các bước thực hiện:
1. Mở terminal mới và di chuyển vào thư mục `frontend`:
   ```powershell
   cd frontend
   ```
2. Cài đặt các gói thư viện cần thiết:
   ```powershell
   npm install
   # Hoặc trên Windows PowerShell nếu gặp lỗi Execution Policy:
   npm.cmd install
   ```
3. Chạy dự án ở môi trường phát triển (Development mode):
   ```powershell
   npm run dev
   # Hoặc trên Windows PowerShell:
   npm.cmd run dev
   ```
4. Truy cập giao diện web tại địa chỉ: `http://localhost:3000`.

---

## 🛠️ Trạng Thái Thực Hiện & Tính Năng Cơ Bản

Hiện tại hệ thống đã hoàn thành cấu hình khung cơ bản (boilerplate) và bắt đầu tích hợp các trang chính:
- [x] **Backend:** Cấu hình Clean Architecture (API, Core, Infrastructure), tích hợp DbContext, cấu hình Controller và cơ sở dữ liệu mẫu.
- [x] **Frontend:** Cấu hình Next.js App Router, bố cục Layout (Trang chủ công khai và trang Quản trị viên), phân chia các component Header, Sidebar, trang quản trị người dùng cơ bản và trang chủ.
- [x] **Đồng bộ thương hiệu:** Tích hợp nhận diện thương hiệu **HITU MARKET** đồng nhất trên giao diện Header, Footer, Trang chủ và trang Admin.
