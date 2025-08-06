const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    description: String,
    imageUrl: String,
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    retailPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    costPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    minStock: { type: Number, required: true },
    unit: { type: String, required: true, enum: ['kg', 'l'] },
    status: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },

    deleted: { type: Boolean, default: false },

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductType' }],
    orderItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
    inventoryTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryTransaction' }],
    
    // Recipe relationships
    recipes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recipe' 
    }], // Multiple recipes can be used for one product
    defaultRecipeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recipe', 
      default: null 
    }, // Primary recipe for cost calculation

    // Composite product functionality
    isComposite: { type: Boolean, default: false }, // Đánh dấu sản phẩm composite
    compositeInfo: {
      // Thông tin về sức chứa của sản phẩm composite
      capacity: { 
        quantity: { type: Number, default: 1 }, // Số lượng phục vụ được (VD: 50 tô)
        unit: { type: String, default: 'tô' } // Đơn vị phục vụ
      },
      // Recipe information for composite products
      recipeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe', 
        default: null 
      }, // Công thức cho sản phẩm composite
      recipeCost: { 
        type: mongoose.Schema.Types.Decimal128, 
        default: null 
      }, // Chi phí tính toán từ công thức
      recipeYield: { 
        quantity: { type: Number, default: 1 }, 
        unit: { type: String, default: 'phần' } 
      }, // Sản lượng của công thức
      // Danh sách sản phẩm con trong composite
      childProducts: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantityPerServing: { type: Number, required: true, min: 0 }, // Số lượng cần cho mỗi phần phục vụ
        unit: { type: String, required: true }, // Đơn vị đo lường của sản phẩm con
        costPrice: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 }, // Giá vốn của sản phẩm con
        sellingPrice: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 }, // Giá bán của sản phẩm con
        retailPrice: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 } // Giá bán lẻ của sản phẩm con
      }],
      // Trạng thái hiện tại của composite
      currentStock: { type: Number, default: 0 }, // Số phần còn lại có thể phục vụ
      lastPreparedAt: { type: Date, default: null }, // Lần chuẩn bị gần nhất
      expiryHours: { type: Number, default: 24 } // Thời gian hết hạn (giờ)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
