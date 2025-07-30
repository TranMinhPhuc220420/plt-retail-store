const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    // Warehouse name for identification
    name: { type: String, required: true },
    
    // Physical address of the warehouse
    address: { type: String, required: true },
    
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    
    // Soft delete flag
    deleted: { type: Boolean, default: false },
    
    // Reference to ingredients stored in this warehouse
    ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
