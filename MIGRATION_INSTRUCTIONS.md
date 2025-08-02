# Chạy Migration Đơn Giản Hóa Đơn Vị

## Tổng Quan
Script này sẽ chuyển đổi tất cả đơn vị đo lường trong hệ thống từ nhiều loại (g, kg, ml, l, piece, etc.) về chỉ sử dụng **kg** và **lít**.

## Chuẩn Bị Trước Khi Chạy

### 1. Backup Database
```bash
# Tạo backup MongoDB
mongodump --db plt-retail-store --out ./backup-before-unit-migration
```

### 2. Đảm Bảo Môi Trường
```bash
# Kiểm tra connection MongoDB
cd backend-plt-2
node -e "require('mongoose').connect('mongodb://localhost:27017/plt-retail-store').then(() => console.log('✅ Connected')).catch(e => console.error('❌ Connection failed:', e))"
```

## Chạy Migration

### Cách 1: Sử dụng npm script
```bash
cd backend-plt-2
npm run migrate:simplify-units
```

### Cách 2: Chạy trực tiếp
```bash
cd backend-plt-2
node migrate_simplify_units.js
```

## Kết Quả Mong Đợi

Migration sẽ hiển thị progress như sau:

```
🚀 Starting unit simplification migration...
📋 Converting all units to kg (weight) and l (volume) only

✅ Connected to MongoDB

🔄 Starting ingredient migration...
✅ Updated ingredient: Flour (2000 g -> 2.000 kg)
✅ Updated ingredient: Milk (1500 ml -> 1.500 l)
✅ Successfully migrated 15 ingredients

🔄 Starting recipe migration...
✅ Updated recipe: Bread Recipe
✅ Successfully migrated 8 recipes

🔄 Starting stock balance migration...
✅ Successfully migrated 25 stock balances

🔄 Starting stock transaction migration...
✅ Successfully migrated 100 stock transactions

🎉 Unit simplification migration completed successfully!
```

## Kiểm Tra Sau Migration

### 1. Kiểm Tra Database
```bash
# Kiểm tra ingredients
mongo plt-retail-store --eval "db.ingredients.find({}, {name: 1, unit: 1, stockQuantity: 1}).limit(5)"

# Kiểm tra recipes
mongo plt-retail-store --eval "db.recipes.find({}, {name: 1, 'ingredients.unit': 1}).limit(3)"
```

### 2. Test Frontend
- Mở form tạo ingredient mới
- Kiểm tra dropdown unit chỉ có kg và l
- Thử tạo ingredient mới với unit kg/l

### 3. Test Backend API
```bash
# Test endpoint
curl -X GET "http://localhost:3000/api/ingredients" | jq '.data[0].unit'
```

## Rollback (Nếu Cần)

Nếu có vấn đề, restore từ backup:

```bash
# Restore database từ backup
mongorestore --db plt-retail-store --drop ./backup-before-unit-migration/plt-retail-store
```

## Troubleshooting

### Lỗi Connection
```bash
# Kiểm tra MongoDB đang chạy
mongod --version
# hoặc
brew services list | grep mongodb
```

### Lỗi Permission
```bash
# Chạy với quyền admin nếu cần
sudo node migrate_simplify_units.js
```

### Kiểm Tra Log
Migration script sẽ log tất cả thay đổi. Nếu có lỗi, check console output để debug.

## Sau Migration

1. **Restart Backend Server**
   ```bash
   npm run dev
   ```

2. **Refresh Frontend**
   ```bash
   cd ../frontend-plt
   npm run dev
   ```

3. **Test Toàn Hệ Thống**
   - Tạo ingredient mới
   - Tạo recipe mới
   - Stock in/out operations
   - Recipe production

## Liên Hệ Hỗ Trợ

Nếu có vấn đề trong quá trình migration, hãy:
1. Giữ nguyên log output
2. Không restart database
3. Liên hệ team để được hỗ trợ debug
