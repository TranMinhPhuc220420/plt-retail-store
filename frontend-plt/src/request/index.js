// The request module is used to handle API requests in the application.
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_VERCEL_SERVER_URL || 'http://localhost:5000/api',
  withCredentials: true, // Include credentials for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle request errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      console.error('Unauthorized access - redirecting to login');
      const requestURL = error.config.url;
      if (requestURL && requestURL.includes('/auth/login')) {
        // If the request is for login, do not redirect to login again
        console.error('Login request failed, but not redirecting to login page again.');
      } else {
        // window.location.href = '/dang-nhap';
      }
    } else {
      // Handle other errors
      console.error('API request error:', error);
    }
    return Promise.reject(error);
  }
);

export const get = (url, params = {}) => {
  return apiClient.get(url, { params });
}

export const post = (url, data, headers={}) => {
  return apiClient.post(url, data, { headers });
}