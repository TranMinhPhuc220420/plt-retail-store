/**
 * Get authentication token from localStorage or cookies
 * @returns {string|null} JWT token
 */
export const getAuthToken = () => {
  // Try localStorage first
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    return token;
  }

  // Try to get from cookies (if stored as httpOnly cookie, this won't work)
  // This is mainly for development/testing
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'authToken' || name === 'token') {
      return value;
    }
  }

  return null;
};

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

/**
 * Remove authentication token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  
  // Clear cookie (if possible)
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Redirect to login if not authenticated
 */
export const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = '/dang-nhap';
    return false;
  }
  return true;
};
