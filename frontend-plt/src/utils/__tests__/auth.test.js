import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAuthToken, setAuthToken, removeAuthToken, isAuthenticated, requireAuth } from '../auth'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock document.cookie
const mockDocument = {
  cookie: '',
}

// Mock window.location
const mockLocation = {
  href: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  global.localStorage = mockLocalStorage
  global.document = mockDocument
  global.window = { location: mockLocation }
  mockLocalStorage.getItem.mockReturnValue(null)
  mockDocument.cookie = ''
  mockLocation.href = ''
})

describe('auth utilities', () => {
  describe('getAuthToken', () => {
    it('should get token from localStorage (authToken key)', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123')
      
      const token = getAuthToken()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken')
      expect(token).toBe('test-token-123')
    })

    it('should get token from localStorage (token key as fallback)', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce(null) // authToken key
        .mockReturnValueOnce('fallback-token-456') // token key
      
      const token = getAuthToken()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token')
      expect(token).toBe('fallback-token-456')
    })

    it('should get token from cookies when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockDocument.cookie = 'authToken=cookie-token-789; path=/'
      
      const token = getAuthToken()
      
      expect(token).toBe('cookie-token-789')
    })

    it('should return null when no token is found', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockDocument.cookie = 'otherCookie=value'
      
      const token = getAuthToken()
      
      expect(token).toBeNull()
    })

    it('should handle multiple cookies correctly', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockDocument.cookie = 'sessionId=abc123; authToken=multi-cookie-token; theme=dark'
      
      const token = getAuthToken()
      
      expect(token).toBe('multi-cookie-token')
    })
  })

  describe('setAuthToken', () => {
    it('should store token in localStorage', () => {
      setAuthToken('new-token-123')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token-123')
    })

    it('should handle empty token', () => {
      setAuthToken('')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', '')
    })

    it('should handle null token', () => {
      setAuthToken(null)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', null)
    })
  })

  describe('removeAuthToken', () => {
    it('should remove token from localStorage', () => {
      removeAuthToken()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    })

    it('should clear cookies', () => {
      // Mock that document.cookie can be set
      let cookieValue = ''
      Object.defineProperty(mockDocument, 'cookie', {
        get: () => cookieValue,
        set: (value) => { cookieValue = value }
      })
      
      removeAuthToken()
      
      // Check that cookies are attempted to be cleared
      expect(cookieValue).toContain('expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token')
      
      const result = isAuthenticated()
      
      expect(result).toBe(true)
    })

    it('should return false when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockDocument.cookie = ''
      
      const result = isAuthenticated()
      
      expect(result).toBe(false)
    })

    it('should return true when token exists in cookies', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockDocument.cookie = 'authToken=cookie-token'
      
      const result = isAuthenticated()
      
      expect(result).toBe(true)
    })
  })

  describe('requireAuth', () => {
    it('should return true when user is authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token')
      
      const result = requireAuth()
      
      expect(result).toBe(true)
      expect(mockLocation.href).toBe('')
    })

    it('should redirect to login when user is not authenticated', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockDocument.cookie = ''
      
      const result = requireAuth()
      
      expect(result).toBe(false)
      expect(mockLocation.href).toBe('/dang-nhap')
    })
  })

  describe('authentication flow scenarios', () => {
    it('should handle complete authentication flow', () => {
      // Store token
      setAuthToken('flow-token-123')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'flow-token-123')
      
      // Retrieve token
      mockLocalStorage.getItem.mockReturnValue('flow-token-123')
      const retrievedToken = getAuthToken()
      expect(retrievedToken).toBe('flow-token-123')
      
      // Check authentication
      const isAuth = isAuthenticated()
      expect(isAuth).toBe(true)
      
      // Require auth should pass
      const authRequired = requireAuth()
      expect(authRequired).toBe(true)
      
      // Remove token
      removeAuthToken()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken')
    })

    it('should handle logout flow', () => {
      // Set token first
      mockLocalStorage.getItem.mockReturnValue('logout-token')
      expect(isAuthenticated()).toBe(true)
      
      // Logout
      removeAuthToken()
      
      // Check that token is removed
      mockLocalStorage.getItem.mockReturnValue(null)
      expect(isAuthenticated()).toBe(false)
      
      // Require auth should fail
      const authRequired = requireAuth()
      expect(authRequired).toBe(false)
      expect(mockLocation.href).toBe('/dang-nhap')
    })
  })
})
