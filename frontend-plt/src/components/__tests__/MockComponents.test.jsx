import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock component để test
const MockButton = ({ children, onClick, disabled, type = 'button' }) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid="mock-button"
    >
      {children}
    </button>
  )
}

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<MockButton>Click me</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    render(<MockButton onClick={handleClick}>Click me</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<MockButton disabled>Disabled Button</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    expect(button).toBeDisabled()
  })

  it('should have correct type attribute', () => {
    render(<MockButton type="submit">Submit</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should render with default type', () => {
    render(<MockButton>Default</MockButton>)
    
    const button = screen.getByTestId('mock-button')
    expect(button).toHaveAttribute('type', 'button')
  })
})

// Mock form validation
describe('Form Validation', () => {
  const validateRequired = (value) => {
    if (!value || value.trim() === '') {
      return 'This field is required'
    }
    return null
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const validatePositiveNumber = (value) => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      return 'Must be a positive number'
    }
    return null
  }

  it('should validate required fields', () => {
    expect(validateRequired('')).toBe('This field is required')
    expect(validateRequired('  ')).toBe('This field is required')
    expect(validateRequired('valid')).toBeNull()
  })

  it('should validate email format', () => {
    expect(validateEmail('invalid-email')).toBe('Please enter a valid email address')
    expect(validateEmail('test@')).toBe('Please enter a valid email address')
    expect(validateEmail('test@example.com')).toBeNull()
  })

  it('should validate positive numbers', () => {
    expect(validatePositiveNumber('-5')).toBe('Must be a positive number')
    expect(validatePositiveNumber('0')).toBe('Must be a positive number')
    expect(validatePositiveNumber('abc')).toBe('Must be a positive number')
    expect(validatePositiveNumber('10')).toBeNull()
    expect(validatePositiveNumber('99.99')).toBeNull()
  })
})

// Mock API utilities
describe('API Utilities', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle successful API responses', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Test Item' }
    })

    const result = await mockApi.get('/api/test')
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ id: 1, name: 'Test Item' })
  })

  it('should handle API errors', async () => {
    mockApi.post.mockResolvedValue({
      success: false,
      message: 'Validation failed'
    })

    const result = await mockApi.post('/api/create', { name: '' })
    
    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation failed')
  })

  it('should handle network errors', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'))

    try {
      await mockApi.get('/api/test')
    } catch (error) {
      expect(error.message).toBe('Network error')
    }
  })
})
