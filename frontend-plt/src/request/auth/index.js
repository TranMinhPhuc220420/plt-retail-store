import { post } from "@/request";

export const verifyGoogleToken = async (token) => {
  try {
    const response = await post('/auth/google-verify-token', {}, { 
      'Authorization': `Bearer ${token}`
    });
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}