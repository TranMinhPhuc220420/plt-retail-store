import { get, post } from "@/request";

export const registerUser = async (data) => {
  try {
    const response = await post('/auth/register', data);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export const loginWithUsername = async (data) => {
  try {
    const response = await post('/auth/login', data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export const getMe = async () => {
  try {
    const response = await get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

export const openPopupLoginWithGoogle = async () => {
  const loginUrl = `${import.meta.env.VITE_VERCEL_SERVER_URL}/auth/google`;

  const popup = window.open(loginUrl,'google-login','width=600,height=700');
  if (!popup) {
    throw new Error('Popup blocked or failed to open');
  }
  
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (popup.closed) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    popup.onerror = (error) => {
      clearInterval(interval);
      reject(error);
    };
  });
}