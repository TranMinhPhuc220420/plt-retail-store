# HƯỚNG DẪN SỬA LỖI ĐƠN VỊ TÍNH GIÁ

## 🚨 VẤN ĐỀ PHÁT HIỆN

Hệ thống có lỗi nghiêm trọng trong việc tính toán giá thành do **không chuyển đổi đơn vị** giữa:
- Đơn vị lưu trữ của nguyên liệu (ví dụ: kg, liter)  
- Đơn vị sử dụng trong công thức (ví dụ: gram, ml)

**Ví dụ lỗi:**
- Nguyên liệu: Bột mì 20.000 VND/kg
- Công thức: Cần 300g bột mì
- **Tính sai:** 20.000 × 300 = 6.000.000 VND 
- **Tính đúng:** 20.000 × 0.3 = 6.000 VND
- **SAI SỐ: 1000 LẦN!**

## 📋 CÁC BƯỚC THỰC HIỆN

### Bước 1: Phân tích vấn đề
```bash
cd backend-plt-2
node audit_unit_issues.js
```

Script này sẽ:
- Kiểm tra tất cả recipes trong hệ thống
- Tìm các trường hợp có lỗi đơn vị
- Báo cáo mức độ nghiêm trọng
- Ước tính sai số tính giá

### Bước 2: Backup dữ liệu (QUAN TRỌNG)
```bash
# Backup MongoDB
mongodump --db plt_retail_store --out backup_$(date +%Y%m%d_%H%M%S)

# Hoặc backup qua MongoDB Compass
# Export collections: recipes, products
```

### Bước 3: Sửa code (Production Fix)
```bash
# Backup file cũ
cp src/utils/costCalculation.js src/utils/costCalculation_OLD.js

# Thay thế bằng file đã fix
cp src/utils/costCalculation_FIXED.js src/utils/costCalculation.js

# Restart server
pm2 restart plt-backend
# hoặc
npm run dev
```

### Bước 4: Migration dữ liệu
```bash
# Chạy migration để sửa dữ liệu hiện tại
node migrate_fix_unit_costs.js
```

Migration sẽ:
- Backup dữ liệu hiện tại
- Tính lại cost cho tất cả recipes với unit conversion đúng
- Cập nhật giá thành sản phẩm
- Tạo báo cáo chi tiết

### Bước 5: Kiểm tra kết quả
```bash
# Chạy lại audit để xác nhận đã fix
node audit_unit_issues.js

# Kiểm tra một vài sản phẩm quan trọng trong admin panel
```

## 📁 CÁC FILE LIÊN QUAN

### Files cần thay thế:
- `src/utils/costCalculation.js` → Thay bằng `costCalculation_FIXED.js`

### Files mới tạo:
- `unit_price_analysis.md` - Phân tích chi tiết vấn đề
- `costCalculation_FIXED.js` - Code đã sửa lỗi
- `recipeUnitAuditor.js` - Tool kiểm tra 
- `audit_unit_issues.js` - Script audit
- `migrate_fix_unit_costs.js` - Script migration

### Files bị ảnh hưởng:
- `src/controllers/recipeController.js` - Sử dụng cost calculation
- `src/controllers/productController.js` - Sử dụng cost calculation
- Frontend cost breakdown components - Hiển thị dữ liệu

## 🔍 KIỂM TRA SAU KHI SỬA

### 1. Test Cases quan trọng:
```javascript
// Recipe sử dụng gram, ingredient tính theo kg
Ingredient: Bột mì - 20.000 VND/kg
Recipe: 300g bột mì
Expected cost: 6.000 VND (20.000 × 0.3)

// Recipe sử dụng ml, ingredient tính theo liter  
Ingredient: Dầu ăn - 50.000 VND/liter
Recipe: 250ml dầu ăn
Expected cost: 12.500 VND (50.000 × 0.25)
```

### 2. Kiểm tra Admin Panel:
- Mở một recipe → Cost Breakdown
- Xem Product Cost Analysis
- So sánh giá before/after

### 3. Kiểm tra API:
```bash
# Get recipe cost calculation
GET /api/recipes/{recipeId}/cost-calculation

# Get product cost
GET /api/products/{productId}/cost-calculation
```

## ⚠️ LƯU Ý QUAN TRỌNG

### Trước khi thực hiện:
1. **BACKUP DỮ LIỆU** - Quan trọng nhất!
2. Thông báo team tạm ngưng nhập liệu recipes/products
3. Chạy vào giờ ít người dùng

### Sau khi thực hiện:
1. Kiểm tra một số sản phẩm quan trọng
2. Review giá bán có phù hợp không
3. Thông báo team về thay đổi giá
4. Update training về đơn vị tính

### Rollback nếu cần:
```bash
# Restore từ backup
mongorestore backup_YYYYMMDD_HHMMSS/

# Restore code cũ
cp src/utils/costCalculation_OLD.js src/utils/costCalculation.js

# Restart server
pm2 restart plt-backend
```

## 📞 HỖ TRỢ

Nếu có vấn đề:
1. Kiểm tra logs: `tail -f logs/app.log`
2. Xem MongoDB logs
3. Chạy audit script để kiểm tra status
4. Rollback nếu cần thiết

## 📈 KẾT QUẢ MONG ĐỢI

Sau khi fix:
- ✅ Cost calculation chính xác với unit conversion
- ✅ Không còn sai số 1000 lần
- ✅ Audit script báo "0 critical errors"
- ✅ Giá thành sản phẩm hợp lý
- ✅ Báo cáo lợi nhuận chính xác

---

**🎯 MỤC TIÊU:** Đảm bảo 100% recipes tính giá đúng với unit conversion chính xác!
