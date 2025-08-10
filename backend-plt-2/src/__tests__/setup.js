const mongoose = require('mongoose');

// Mock mongoose connection
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    collections: {},
  },
  Types: {
    ObjectId: jest.fn(() => 'mockedObjectId')
  },
  Schema: jest.fn(() => ({})),
  model: jest.fn(() => jest.fn())
}));

beforeAll(async () => {
  // Mock database connection
  const mongoose = require('mongoose');
  mongoose.connect.mockResolvedValue();
});

afterAll(async () => {
  // Mock disconnect
  const mongoose = require('mongoose');
  mongoose.disconnect.mockResolvedValue();
});

beforeEach(async () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);
