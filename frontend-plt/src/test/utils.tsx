import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

// Mock fetch
export const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn(() => mockApiResponse(response, status))
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test data
export const mockUser = {
  _id: '65f1234567890abcdef12345',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  createdAt: '2024-01-01T00:00:00.000Z',
}

export const mockStore = {
  _id: '65f1234567890abcdef12346',
  storeCode: 'TEST001',
  name: 'Test Store',
  address: '123 Test Street',
  ownerId: mockUser._id,
  createdAt: '2024-01-01T00:00:00.000Z',
}

export const mockProduct = {
  _id: '65f1234567890abcdef12347',
  productCode: 'PROD001',
  name: 'Test Product',
  description: 'Test product description',
  category: 'electronics',
  price: 100000,
  retailPrice: 120000,
  storeId: mockStore._id,
  stock: {
    quantity: 50,
    unit: 'piece'
  },
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))
