import { get, post } from "@/request";

export const getAllProducts = async () => {
  try {
    const response = await get('/product/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}