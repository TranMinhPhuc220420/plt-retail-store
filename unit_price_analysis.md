# PHÂN TÍCH CÁC TRƯỜNG HỢP LỖI TÍNH TOÁN ĐƠN VỊ GIÁ

## 🚨 VẤN ĐỀ NGHIÊM TRỌNG PHÁT HIỆN

### 1. LỖI CHÍNH: TÍNH TOÁN CHI PHÍ KHÔNG CHUYỂN ĐỔI ĐƠN VỊ

**File:** `backend-plt-2/src/utils/costCalculation.js`
**Dòng 34:** `const ingredientTotalCost = unitCost * recipeIngredient.amountUsed;`

**Vấn đề:** 
- `unitCost` lấy từ `ingredient.standardCost` hoặc `ingredient.averageCost` với đơn vị của nguyên liệu (ví dụ: giá theo kg)
- `recipeIngredient.amountUsed` có thể có đơn vị khác (ví dụ: sử dụng theo gram)
- **KHÔNG CÓ CHUYỂN ĐỔI ĐƠN VỊ** trước khi nhân

**Ví dụ lỗi:**
- Nguyên liệu A: giá 10.000 VND/kg, đơn vị lưu trữ: kg
- Công thức cần: 500g của nguyên liệu A
- Tính toán sai: 10.000 * 500 = 5.000.000 VND (thay vì 10.000 * 0.5 = 5.000 VND)
- **LỖI TÍNH GIÁ CAO GẤP 1000 LẦN!**

### 2. CÁC TRƯỜNG HỢP CỤ THỂ CÓ THỂ BỊ LỖI

#### 2.1. Trong Recipe Cost Calculation
```javascript
// FILE: backend-plt-2/src/utils/costCalculation.js
// Dòng 10-50: calculateRecipeIngredientCost()

for (const recipeIngredient of recipe.ingredients) {
  const ingredient = recipeIngredient.ingredientId;
  const unitCost = ingredient.averageCost || ingredient.standardCost || 0;
  const unitCostNumber = parseFloat(unitCost.toString());
  
  // ❌ LỖI: Không chuyển đổi đơn vị
  const ingredientTotalCost = unitCostNumber * recipeIngredient.amountUsed;
  
  // ✅ ĐÚNG: Cần chuyển đổi đơn vị
  // const convertedAmount = convertUnit(
  //   recipeIngredient.amountUsed, 
  //   recipeIngredient.unit, 
  //   ingredient.unit
  // );
  // const ingredientTotalCost = unitCostNumber * convertedAmount;
}
```

#### 2.2. Các Cases có thể bị ảnh hưởng:

**Case 1: Nguyên liệu tính theo KG, Recipe dùng GRAM**
- Ingredient: Bột mì - 20.000 VND/kg 
- Recipe: Cần 300g bột mì
- Sai: 20.000 * 300 = 6.000.000 VND
- Đúng: 20.000 * 0.3 = 6.000 VND

**Case 2: Nguyên liệu tính theo LITER, Recipe dùng ML**
- Ingredient: Dầu ăn - 50.000 VND/liter
- Recipe: Cần 250ml dầu ăn  
- Sai: 50.000 * 250 = 12.500.000 VND
- Đúng: 50.000 * 0.25 = 12.500 VND

**Case 3: Nguyên liệu tính theo GRAM, Recipe dùng KG**
- Ingredient: Gia vị - 100 VND/gram
- Recipe: Cần 2kg gia vị
- Sai: 100 * 2 = 200 VND  
- Đúng: 100 * 2000 = 200.000 VND

### 3. CÁC FILE VÀ FUNCTION BỊ ẢNH HƯỞNG

#### 3.1. Backend Files:
1. **`src/utils/costCalculation.js`**
   - `calculateRecipeIngredientCost()` - LỖI CHÍNH
   - `calculateProductCostFromRecipe()` - Gián tiếp bị ảnh hưởng
   - `updateProductPricingBasedOnCost()` - Gián tiếp bị ảnh hưởng
   - `getCostBreakdown()` - Gián tiếp bị ảnh hưởng

2. **`src/controllers/recipeController.js`**
   - `calculateRecipeCost()` - Sử dụng function bị lỗi
   - `updateRecipeCostCalculation()` - Sử dụng function bị lỗi
   - `getAllWithCosts()` - Sử dụng function bị lỗi

3. **`src/controllers/productController.js`**
   - `calculateProductCost()` - Sử dụng function bị lỗi
   - `getCostBreakdown()` - Sử dụng function bị lỗi

#### 3.2. Frontend Files (Hiển thị dữ liệu sai):
1. **`src/components/form/CostBreakdown.jsx`** - Hiển thị chi phí sai
2. **`src/pages/admin/ProductRecipeManagement.jsx`** - Hiển thị cost analysis sai
3. **`src/store/productRecipe.js`** - Store dữ liệu cost sai

### 4. ĐIỂM TÍCH CỰC: CÁC FUNCTION ĐÚNG

#### 4.1. Inventory Integration - ĐÚNG
**File:** `src/utils/inventoryIntegration.js`
```javascript
// ✅ CÓ SỬ DỤNG CHUYỂN ĐỔI ĐƠN VỊ
const availabilityCheck = checkIngredientAvailability(
  ingredient.stockQuantity,
  ingredient.unit,
  requiredAmount,
  recipeIngredient.unit
);
```

#### 4.2. Unit Converter - ĐÚNG
**File:** `src/utils/unitConverter.js`
- Có đầy đủ các function chuyển đổi đơn vị
- `convertUnit()`, `checkIngredientAvailability()` hoạt động đúng

### 5. TÁC ĐỘNG NGHIỆP VỤ

#### 5.1. Tác động trực tiếp:
- **Tính giá thành sai** cho tất cả sản phẩm có recipe
- **Định giá bán sai** dựa trên cost calculation
- **Báo cáo lợi nhuận sai**
- **Quyết định kinh doanh sai** dựa trên số liệu cost

#### 5.2. Các trường hợp cụ thể:
- Recipe sử dụng gram, ingredient tính theo kg → Giá cao gấp 1000 lần
- Recipe sử dụng ml, ingredient tính theo liter → Giá cao gấp 1000 lần  
- Recipe sử dụng kg, ingredient tính theo gram → Giá thấp 1000 lần

### 6. KHUYẾN NGHỊ SỬA CHỮA

#### 6.1. Fix ngay lập tức:
1. Sửa function `calculateRecipeIngredientCost()` trong `costCalculation.js`
2. Import và sử dụng `convertUnit` từ `unitConverter.js`
3. Chuyển đổi `recipeIngredient.amountUsed` về cùng đơn vị với `ingredient.unit` trước khi tính toán

#### 6.2. Code fix mẫu:
```javascript
// Import unit converter
const { convertUnit } = require('./unitConverter');

// Trong calculateRecipeIngredientCost()
for (const recipeIngredient of recipe.ingredients) {
  const ingredient = recipeIngredient.ingredientId;
  
  if (!ingredient) continue;

  const unitCost = ingredient.averageCost || ingredient.standardCost || 0;
  const unitCostNumber = parseFloat(unitCost.toString());
  
  // ✅ CHUYỂN ĐỔI ĐƠN VỊ TRƯỚC KHI TÍNH TOÁN
  const convertedAmount = convertUnit(
    recipeIngredient.amountUsed,
    recipeIngredient.unit,
    ingredient.unit
  );
  
  if (convertedAmount === null) {
    console.warn(`Cannot convert ${recipeIngredient.unit} to ${ingredient.unit} for ingredient ${ingredient.name}`);
    continue;
  }
  
  const ingredientTotalCost = unitCostNumber * convertedAmount;
  totalCost += ingredientTotalCost;

  costBreakdown.push({
    ingredientId: ingredient._id,
    ingredientName: ingredient.name,
    amountUsed: recipeIngredient.amountUsed,
    unit: recipeIngredient.unit,
    convertedAmount: convertedAmount,
    ingredientUnit: ingredient.unit,
    unitCost: unitCostNumber,
    totalCost: ingredientTotalCost
  });
}
```

### 7. TESTING SCENARIOS

#### 7.1. Test Cases cần kiểm tra:
1. Recipe dùng gram, ingredient tính kg
2. Recipe dùng ml, ingredient tính liter  
3. Recipe dùng kg, ingredient tính gram
4. Recipe dùng liter, ingredient tính ml
5. Recipe và ingredient cùng đơn vị
6. Đơn vị không tương thích (gram vs ml)

#### 7.2. Expected Results:
- Cost calculation phải chính xác theo tỷ lệ chuyển đổi
- Không được có sai số lớn (>5%)
- Báo lỗi rõ ràng khi không thể chuyển đổi đơn vị

### 8. KẾT LUẬN

Đây là một lỗi **CỰC KỲ NGHIÊM TRỌNG** có thể gây ra:
- Sai số tính toán lên đến **1000 lần**
- Ảnh hưởng toàn bộ hệ thống tính giá thành
- Dẫn đến quyết định kinh doanh sai lầm

**CẦN SỬA CHỮA NGAY LẬP TỨC!**
