# PLT Retail Store

## 📖 Giới thiệu

PLT Retail Store là một giải pháp quản lý bán lẻ toàn diện, được thiết kế để giúp các doanh nghiệp tối ưu hóa hoạt động, từ quản lý kho, bán hàng, nhân sự đến phân tích chi phí. Hệ thống bao gồm một giao diện frontend được xây dựng bằng React và một backend mạnh mẽ sử dụng Express.js, kết nối với cơ sở dữ liệu MongoDB.

## ✨ Tính năng chính

*   **Bảng điều khiển (Dashboard):** Cung cấp cái nhìn tổng quan về hiệu suất bán hàng, đơn hàng gần đây, và các cảnh báo quan trọng.
*   **Quản lý Cửa hàng & Kho:** Dễ dàng thêm, sửa, xóa và quản lý thông tin nhiều cửa hàng và kho hàng.
*   **Quản lý Sản phẩm:**
    *   Hỗ trợ sản phẩm đơn giản và sản phẩm tổng hợp (composite products).
    *   Quản lý danh mục, giá bán, giá vốn, và hình ảnh sản phẩm.
*   **Quản lý Nguyên vật liệu:**
    *   Theo dõi tồn kho, nhà cung cấp, và điều kiện bảo quản.
    *   Thực hiện nhập, xuất, và kiểm kê kho nguyên vật liệu.
*   **Quản lý Công thức (Recipe):**
    *   Tạo và quản lý công thức chế biến từ các nguyên vật liệu.
    *   Tự động tính toán chi phí và kiểm tra tính khả thi dựa trên tồn kho.
*   **Quản lý Nhà cung cấp:** Lưu trữ thông tin chi tiết, theo dõi hiệu suất và quản lý đơn hàng.
*   **Phân tích Chi phí:** Cung cấp các công cụ để phân tích chi phí sản phẩm và công thức, giúp tối ưu hóa lợi nhuận.
*   **Quản lý Nhân viên:** Quản lý thông tin nhân viên, vai trò và quyền hạn.
*   **Bảo mật & Phân quyền:** Hệ thống phân quyền người dùng và bảo mật dữ liệu.

## 🛠️ Công nghệ sử dụng

*   **Frontend:** React, Ant Design
*   **Backend:** Node.js, Express.js
*   **Cơ sở dữ liệu:** MongoDB
*   **Containerization:** Docker, Docker Compose

## 🚀 Bắt đầu

### Yêu cầu hệ thống

*   [Node.js](https://nodejs.org/) (phiên bản 16.x trở lên)
*   [Docker](https://www.docker.com/) và [Docker Compose](https://docs.docker.com/compose/)

### Cài đặt và Chạy (Môi trường Development)

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd plt-retail-store
    ```

2.  **Thiết lập biến môi trường:**
    Tạo các tệp `.env` trong thư mục gốc, `backend-plt-2` và `frontend-plt` dựa trên các tệp `.env.example` (nếu có).

3.  **Khởi chạy các dịch vụ với Docker Compose:**
    Lệnh này sẽ khởi tạo backend, frontend và cơ sở dữ liệu MongoDB.
    ```bash
    docker-compose -f docker-compose.dev.yml up -d --build
    ```

4.  **Truy cập ứng dụng:**
    *   Frontend: [http://localhost:5173](http://localhost:5173)
    *   Backend API: [http://localhost:5000](http://localhost:5000)

### Triển khai Production

#### Option 1: Standard Build (VPS có >= 2GB RAM + Swap)
```bash
make prod-build-clean
```

#### Option 2: Low-Memory Build (VPS có 1-2GB RAM)
```bash
# Check resources first
chmod +x check-vps-resources.sh
./check-vps-resources.sh

# Build with low-memory strategy
make prod-build-low-memory
```

#### Option 3: Build Locally (VPS < 1GB RAM hoặc build fail)
```bash
# On Windows machine
build-production-local.bat

# Copy to VPS
scp -r frontend-plt/dist/ user@vps:/path/to/project/frontend-plt/

# On VPS
docker compose -f docker-compose.prebuilt.yml up -d
```

### 🚨 Troubleshooting

**Gặp lỗi "SIGKILL" hoặc "Out of Memory" khi build?**

👉 Xem hướng dẫn chi tiết: [QUICK-FIX-OOM.md](./QUICK-FIX-OOM.md)

Hoặc chạy script kiểm tra:
```bash
./check-vps-resources.sh
```

## 📁 Cấu trúc thư mục

```
plt-retail-store/
├── backend-plt-2/      # Backend (Node.js/Express)
├── frontend-plt/       # Frontend (React)
├── mongo-init/         # Script khởi tạo MongoDB
├── .env                # Biến môi trường chung
├── docker-compose.yml  # Docker Compose cho Production
├── docker-compose.dev.yml # Docker Compose cho Development
└── README.MD           # Tài liệu dự án
```

## 🤝 Đóng góp

Chúng tôi luôn chào đón các đóng góp để cải thiện dự án. Vui lòng làm theo các bước sau:

1.  Fork repository.
2.  Tạo một branch mới (`git checkout -b feature/AmazingFeature`).
3.  Commit các thay đổi của bạn (`git commit -m 'Add some AmazingFeature'`).
4.  Push lên branch (`git push origin feature/AmazingFeature`).
5.  Mở một Pull Request.

## 📞 Liên hệ

Nếu có bất kỳ câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ với PLT Solutions qua email: [support@plt-solutions.com](mailto:support@plt-solutions.com).