const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    storeCode: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: String,
    email: String,
    description: String,
    imageUrl: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager' }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
    shifts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ShiftHandover' }],
    productTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductType' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Store', storeSchema);
