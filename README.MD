# PLT Retail Store

> **⚠️ Important**: This is a large-scale application (4,753+ modules). Please review the [Docker Build Optimization Guide](DOCKER_BUILD_OPTIMIZATION.md) for production build requirements.

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
*   **Minimum RAM: 12 GB** (Recommended: 16 GB) for production builds
*   **Docker Desktop Memory Limit**: Set to 12-16 GB in Settings → Resources

> **📚 Build Documentation**: See [DOCKER_BUILD_OPTIMIZATION.md](DOCKER_BUILD_OPTIMIZATION.md) for detailed build configuration and troubleshooting.

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

### Production Build

**Recommended Method** (with resource monitoring and retry logic):
```bash
./build-production.sh
```

**Manual Method**:
```bash
# Enable BuildKit for better performance
DOCKER_BUILDKIT=1 docker compose build --no-cache
docker compose up -d
```

**Expected Build Time**: 2-4 minutes

**Troubleshooting**:
- If build fails with SIGKILL: Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- For detailed optimization guide: See [DOCKER_BUILD_OPTIMIZATION.md](DOCKER_BUILD_OPTIMIZATION.md)
- For visual reference: See [VISUAL_GUIDE.md](VISUAL_GUIDE.md)

## 📚 Documentation

### Build & Deployment
- **[SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)** - Executive summary of Docker build optimization
- **[DOCKER_BUILD_OPTIMIZATION.md](DOCKER_BUILD_OPTIMIZATION.md)** - Complete technical guide (7.5KB)
- **[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** - Visual diagrams and quick reference (16KB)
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Quick fixes for common issues (4.9KB)
- **[CHANGES.md](CHANGES.md)** - Detailed change log (7.6KB)
- **[frontend-plt/BUILD.md](frontend-plt/BUILD.md)** - Frontend-specific build guide (5KB)

### Key Highlights
- ✅ Optimized for large-scale applications (4,753+ modules)
- ✅ Memory-efficient build configuration (8GB heap)
- ✅ Intelligent code chunking for performance
- ✅ Cross-platform build scripts (Linux/Windows)
- ✅ Comprehensive monitoring and error handling

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