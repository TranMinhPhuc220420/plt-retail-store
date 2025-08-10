const mongoose = require('mongoose');

// Mock mongoose to avoid database connection requirements
const mockSchema = function(definition) {
  this.definition = definition;
  this.methods = {};
  this.statics = {};
  this.virtuals = {};
  this.pre = jest.fn();
  this.post = jest.fn();
  this.index = jest.fn();
  this.set = jest.fn();
  this.virtual = jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn()
  });
  return this;
};

// Mock mongoose model
const mockModel = jest.fn().mockImplementation((name, schema) => {
  const model = jest.fn().mockImplementation((data) => {
    const instance = {
      ...data,
      _id: new mongoose.Types.ObjectId(),
      save: jest.fn().mockResolvedValue(instance),
      remove: jest.fn().mockResolvedValue(instance),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      validate: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(data),
      toJSON: jest.fn().mockReturnValue(data)
    };
    return instance;
  });
  
  // Static methods
  model.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockResolvedValue([])
        })
      })
    })
  });
  model.findOne = jest.fn().mockResolvedValue(null);
  model.findById = jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue(null)
  });
  model.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  model.findByIdAndDelete = jest.fn().mockResolvedValue(null);
  model.findOneAndUpdate = jest.fn().mockResolvedValue(null);
  model.findOneAndDelete = jest.fn().mockResolvedValue(null);
  model.create = jest.fn().mockResolvedValue({});
  model.insertMany = jest.fn().mockResolvedValue([]);
  model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  model.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  model.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  model.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
  model.countDocuments = jest.fn().mockResolvedValue(0);
  model.aggregate = jest.fn().mockResolvedValue([]);
  model.distinct = jest.fn().mockResolvedValue([]);
  
  return model;
});

// Mock mongoose connection
const mockConnection = {
  dropDatabase: jest.fn().mockResolvedValue(),
  close: jest.fn().mockResolvedValue(),
  collections: {},
  readyState: 1
};

// Override mongoose methods
jest.spyOn(mongoose, 'connect').mockResolvedValue();
jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
Object.defineProperty(mongoose, 'connection', {
  get: () => mockConnection
});
Object.defineProperty(mongoose, 'Schema', {
  get: () => mockSchema
});
Object.defineProperty(mongoose, 'model', {
  get: () => mockModel
});

// Ensure Types are available
mongoose.Types = mongoose.Types || {};
mongoose.Types.ObjectId = mongoose.Types.ObjectId || function(id) {
  return id || 'mockedObjectId';
};
mongoose.Types.Decimal128 = mongoose.Types.Decimal128 || function(value) {
  return { toString: () => String(value) };
};

// Mock Schema.Types
mongoose.Schema.Types = {
  ObjectId: mongoose.Types.ObjectId,
  Decimal128: mongoose.Types.Decimal128,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  Array: Array,
  Mixed: Object
};

beforeAll(async () => {
  // Mock database connection
  await mongoose.connect('mongodb://localhost:27017/test');
});

afterAll(async () => {
  // Mock disconnect
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);
