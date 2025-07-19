// The request module is used to handle API requests in the application.
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_VERCEL_SERVER_URL || 'http://localhost:5000/api',
  withCredentials: true, // Include credentials for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiFormDataClient = axios.create({
  baseURL: import.meta.env.VITE_VERCEL_SERVER_URL || 'http://localhost:5000/api',
  withCredentials: true, // Include credentials for cross-origin requests
  headers: {
    'Content-Type': 'multipart/form-data',
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
  if (headers['Content-Type'] === 'multipart/form-data') {
    return apiFormDataClient.post(url, data, { headers });
  }

  return apiClient.post(url, data, { headers });
}

export const put = (url, data, headers={}) => {
  if (headers['Content-Type'] === 'multipart/form-data') {
    return apiFormDataClient.put(url, data, { headers });
  }
  return apiClient.put(url, data, { headers });
}

export const deleteRequest = (url, params = {}) => {
  return apiClient.delete(url, { params });
} 

export const getApi = (url, params = {}) => {
  return apiClient.get(`api${url}`, { params });
}

export const postApi = (url, data, headers={}) => {
  if (headers['Content-Type'] === 'multipart/form-data') {
    return apiFormDataClient.post(`api${url}`, data, { headers });
  }

  return apiClient.post(`api${url}`, data, { headers });
}

export const putApi = (url, data, headers={}) => {
  if (headers['Content-Type'] === 'multipart/form-data') {
    return apiFormDataClient.put(`api${url}`, data, { headers });
  }
  return apiClient.put(`api${url}`, data, { headers });
}

export const deleteApi = (url, params = {}) => {
  return apiClient.delete(`api${url}`, { params });
}