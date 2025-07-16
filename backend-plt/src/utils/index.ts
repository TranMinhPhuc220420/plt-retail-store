import { IMAGE_PRODUCT_DEFAULT } from "@/config";
import { Product } from "@/interfaces";

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(phone);
}

export const tryValueParseInt = (value: string): number | null => {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? null : parsedValue;
}

export const isNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value);
}

export const generateCacheKey = (prefix: string, ...args: (string | number)[]): string => {
  return `${prefix}:${args.join(':')}`;
}

// Product utilities
export const convertProductData = (product: any, needCheckId: boolean = false): Product => {
  if (!product || typeof product !== 'object') {
    throw new Error('Invalid product data');
  }
  if (needCheckId && (!product.id || typeof product.id !== 'string')) {
    throw new Error('Product ID is required and must be a string');
  }
  if (!product.productCode || typeof product.productCode !== 'string') {
    throw new Error('Product code is required and must be a string');
  }
  if (!product.name || !product.price) {
    throw new Error('Product data is missing required fields');
  }

  const price = tryValueParseInt(product.price.toString());
  if (price === null || price < 0) {
    throw new Error('Product price must be a non-negative number');
  }
  const retailPrice = tryValueParseInt(product.retailPrice.toString());
  if (retailPrice === null || retailPrice < 0) {
    throw new Error('Product retail price must be a non-negative number');
  }
  const wholesalePrice = tryValueParseInt(product.wholesalePrice.toString());
  if (wholesalePrice === null || wholesalePrice < 0) {
    throw new Error('Product wholesale price must be a non-negative number');
  }
  const costPrice = tryValueParseInt(product.costPrice.toString());
  if (costPrice === null || costPrice < 0) {
    throw new Error('Product cost price must be a non-negative number');
  }
  const stock = tryValueParseInt(product.stock.toString());
  if (stock === null || stock < 0) {
    throw new Error('Product stock must be a non-negative number');
  }
  const minStock = tryValueParseInt(product.minStock.toString());
  if (minStock === null || minStock < 0) {
    throw new Error('Product minimum stock must be a non-negative number');
  }
  if (!product.unit || typeof product.unit !== 'string') {
    throw new Error('Product unit is required and must be a string');
  }
  if (!product.status || typeof product.status !== 'string') {
    throw new Error('Product status is required and must be a string');
  }
  if (!product.ownerId || typeof product.ownerId !== 'string') {
    throw new Error('Product owner ID is required and must be a string');
  }
  if (!product.storeId || typeof product.storeId !== 'string') {
    throw new Error('Product store ID is required and must be a string');
  }

  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    imageUrl: product.imageUrl || IMAGE_PRODUCT_DEFAULT,
    description: product.description || '',
    price: price,
    retailPrice: retailPrice,
    wholesalePrice: wholesalePrice,
    costPrice: costPrice,
    stock: stock,
    minStock: minStock,
    unit: product.unit,
    status: product.status,
    ownerId: product.ownerId,
    storeId: product.storeId,
    categories: product.categories || [],
    createdAt: product.createdAt || new Date(),
    updatedAt: product.updatedAt || new Date(),
  } as Product;
}