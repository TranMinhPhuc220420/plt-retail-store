import { UnauthorizedException, BadRequestException } from '@nestjs/common';

import { isValidEmail, tryValueParseInt } from '@/utils';

// Interface for validation
import { User, Store, ProductType, Product, Employee, StoreManager, Customer } from '@/interfaces';

// Constants
import { ADMIN_ROLE, STORE_CODE_NOT_ALLOWED_TO_CREATE } from '@/config';

//////////////////////////////////////////////
/**                 Store                   */
//////////////////////////////////////////////
export function validateStoreCode(storeCode: string): void {
  if (!storeCode || storeCode.trim() === '') {
    throw new BadRequestException('store_code_is_required');
  }
  if (storeCode.length < 3 || storeCode.length > 20) {
    throw new BadRequestException('store_code_length_invalid');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(storeCode)) {
    throw new BadRequestException('store_code_invalid_characters');
  }
  if (STORE_CODE_NOT_ALLOWED_TO_CREATE.includes(storeCode.toLowerCase())) {
    throw new BadRequestException('store_code_not_allowed_to_create');
  }
}
export function validateStoreData(store: Store, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!store) {
    throw new BadRequestException('store_data_is_required');
  }

  validateStoreCode(store.storeCode);

  if (!store.name || store.name.trim() === '') {
    throw new BadRequestException('store_name_is_required');
  }

  if (!store.address || store.address.trim() === '') {
    throw new BadRequestException('store_address_is_required');
  }

  if (!store.phone || store.phone.trim() === '') {
    throw new BadRequestException('store_phone_is_required');
  }

  if (store.email && !isValidEmail(store.email)) {
    throw new BadRequestException('store_email_is_invalid');
  }

  if (!store.description || store.description.trim() === '') {
    throw new BadRequestException('store_description_is_required');
  }

  if (!store.imageUrl || store.imageUrl.trim() === '') {
    throw new BadRequestException('store_avatar_is_required');
  }
  
  if (!store.ownerId || store.ownerId !== user.id) {
    throw new BadRequestException('store_owner_id_is_invalid');
  }
}
export function validateStoreUpdateData(store: Store, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!store) {
    throw new BadRequestException('store_data_is_required');
  }

  if (store.storeCode && store.storeCode.trim() === '') {
    throw new BadRequestException('store_code_is_required');
  }

  if (store.name && store.name.trim() === '') {
    throw new BadRequestException('store_name_is_required');
  }

  if (store.address && store.address.trim() === '') {
    throw new BadRequestException('store_address_is_required');
  }

  if (store.phone && store.phone.trim() === '') {
    throw new BadRequestException('store_phone_is_required');
  }

  if (store.email && !isValidEmail(store.email)) {
    throw new BadRequestException('store_email_is_invalid');
  }

  if (store.description && store.description.trim() === '') {
    throw new BadRequestException('store_description_is_required');
  }

  if (store.imageUrl && store.imageUrl.trim() === '') {
    throw new BadRequestException('store_avatar_is_required');
  }
}
export function validateStoreDelete(storeId: string, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!storeId || storeId.trim() === '') {
    throw new BadRequestException('store_id_is_required');
  }
}

//////////////////////////////////////////////
/**                 ProductType                   */
/** interface ProductType {
      id: string; // Unique identifier for the product type
      name: string; // Name of the product type
      description?: string; // Optional description of the product type
      createdAt: Date; // Timestamp of when the product type was created
      updatedAt: Date; // Timestamp of when the product type was last updated

      ownerId: string; // Reference to the user who owns the store

      owner?: User; // Optional reference to the owner user object
      products?: Product[]; // Optional array of products associated with this product type
    }
*/
//////////////////////////////////////////////
export function validateProductTypeData(productType: ProductType, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!productType) {
    throw new BadRequestException('product_type_data_is_required');
  }
  if (!productType.name || productType.name.trim() === '') {
    throw new BadRequestException('product_type_name_is_required');
  }
  
  if (productType.description && productType.description.trim() === '') {
    throw new BadRequestException('product_type_description_is_required');
  }

  if (!productType.storeId || productType.storeId.trim() === '') {
    throw new BadRequestException('product_type_store_id_is_required');
  }
  if (!productType.ownerId || productType.ownerId !== user.id) {
    throw new BadRequestException('product_type_owner_id_is_invalid');
  }
}
export function validateProductTypeUpdateData(productType: ProductType, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!productType) {
    throw new BadRequestException('product_type_data_is_required');
  }

  if (productType.name && productType.name.trim() === '') {
    throw new BadRequestException('product_type_name_is_required');
  }

  if (productType.description && productType.description.trim() === '') {
    throw new BadRequestException('product_type_description_is_required');
  }

  if (!productType.storeId || productType.storeId.trim() === '') {
    throw new BadRequestException('product_type_store_id_is_required');
  }
  if (productType.ownerId && productType.ownerId !== user.id) {
    throw new BadRequestException('product_type_owner_id_is_invalid');
  }
}
export function validateProductTypeDelete(productTypeId: string, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!productTypeId || productTypeId.trim() === '') {
    throw new BadRequestException('product_type_id_is_required');
  }
}

//////////////////////////////////////////////
/**                 Product                   */
/** interface Product {
  id: string; // Unique identifier for the product
  name: string; // Name of the product
  description?: string; // Optional description of the product
  price: number; // Price of the product
  stock: number; // Current stock level of the product
  imageUrl?: string; // Optional URL to an image of the product
  createdAt: Date; // Timestamp of when the product was created
  updatedAt: Date; // Timestamp of when the product was last updated
  
  ownerId: string; // Reference to the user who owns the store
  storeId: string; // Reference to the store where the product is available
  store?: Store; // Optional reference to the store object

  owner?: User; // Optional reference to the owner user object
  categories?: ProductType[]; // Optional array of product types/categories associated with this product
}
*/
//////////////////////////////////////////////
export function validateProductData(product: Product, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!product) {
    throw new BadRequestException('product_data_is_required');
  }
  if (!product.productCode || product.productCode.trim() === '') {
    throw new BadRequestException('product_code_is_required');
  }
  if (!product.name || product.name.trim() === '') {
    throw new BadRequestException('product_name_is_required');
  }

  if (!product.imageUrl || product.imageUrl.trim() === '') {
    throw new BadRequestException('store_avatar_is_required');
  }

  const parsedPrice = tryValueParseInt(product.price.toString());
  if (parsedPrice === null || parsedPrice < 0) {
    throw new BadRequestException('product_price_is_invalid');
  }

  const parsedRetailPrice = tryValueParseInt(product.retailPrice.toString());
  if (parsedRetailPrice === null || parsedRetailPrice < 0) {
    throw new BadRequestException('product_retail_price_is_invalid');
  }

  const parsedWholesalePrice = tryValueParseInt(product.wholesalePrice.toString());
  if (parsedWholesalePrice === null || parsedWholesalePrice < 0) {
    throw new BadRequestException('product_wholesale_price_is_invalid');
  }

  const parsedCostPrice = tryValueParseInt(product.costPrice.toString());
  if (parsedCostPrice === null || parsedCostPrice < 0) {
    throw new BadRequestException('product_cost_price_is_invalid');
  }

  const parsedStock = tryValueParseInt(product.stock.toString());
  if (parsedStock === null || parsedStock < 0) {
    throw new BadRequestException('product_stock_is_invalid');
  }

  const parsedMinStock = tryValueParseInt(product.minStock.toString());
  if (parsedMinStock === null || parsedMinStock < 0) {
    throw new BadRequestException('product_min_stock_is_invalid');
  }

  if (!product.unit || product.unit.trim() === '') {
    throw new BadRequestException('product_unit_is_required');
  }

  if (!product.status || product.status.trim() === '') {
    throw new BadRequestException('product_status_is_required');
  }

  if (product.categories && !Array.isArray(product.categories)) {
    throw new BadRequestException('product_categories_must_be_an_array');
  }

  if (!product.ownerId || product.ownerId !== user.id) {
    throw new BadRequestException('product_owner_id_is_invalid');
  }

  if (!product.storeId || product.storeId.trim() === '') {
    throw new BadRequestException('product_store_id_is_required');
  }
}
export function validateProductUpdateData(product: Product, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!product) {
    throw new BadRequestException('product_data_is_required');
  }
  if (!product.productCode || product.productCode.trim() === '') {
    throw new BadRequestException('product_code_is_required');
  }

  if (product.name && product.name.trim() === '') {
    throw new BadRequestException('product_name_is_required');
  }

  if (product.price !== undefined && (typeof product.price !== 'number' || product.price < 0)) {
    throw new BadRequestException('product_price_is_invalid');
  }

  if (product.retailPrice !== undefined && (typeof product.retailPrice !== 'number' || product.retailPrice < 0)) {
    throw new BadRequestException('product_retail_price_is_invalid');
  }

  if (product.wholesalePrice !== undefined && (typeof product.wholesalePrice !== 'number' || product.wholesalePrice < 0)) {
    throw new BadRequestException('product_wholesale_price_is_invalid');
  }

  if (product.costPrice !== undefined && (typeof product.costPrice !== 'number' || product.costPrice < 0)) {
    throw new BadRequestException('product_cost_price_is_invalid');
  }

  if (product.stock !== undefined && (typeof product.stock !== 'number' || product.stock < 0)) {
    throw new BadRequestException('product_stock_is_invalid');
  }

  if (product.minStock !== undefined && (typeof product.minStock !== 'number' || product.minStock < 0)) {
    throw new BadRequestException('product_min_stock_is_invalid');
  }

  if (product.unit && product.unit.trim() === '') {
    throw new BadRequestException('product_unit_is_required');
  }

  if (product.status && product.status.trim() === '') {
    throw new BadRequestException('product_status_is_required');
  }

  if (product.categories && !Array.isArray(product.categories)) {
    throw new BadRequestException('product_categories_must_be_an_array');
  }
  if (product.ownerId && product.ownerId !== user.id) {
    throw new BadRequestException('product_owner_id_is_invalid');
  }

  if (product.storeId && product.storeId.trim() === '') {
    throw new BadRequestException('product_store_id_is_required');
  }
}
export function validateProductDelete(productId: string, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!productId || productId.trim() === '') {
    throw new BadRequestException('product_id_is_required');
  }
}

//////////////////////////////////////////////
/**                 Employee                   */
//////////////////////////////////////////////
export function validateEmployeeData(employee: Employee, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!employee) {
    throw new BadRequestException('employee_data_is_required');
  }
  if (!employee.userId || employee.userId.trim() === '') {
    throw new BadRequestException('employee_user_id_is_required');
  }
  if (!employee.storeId || employee.storeId.trim() === '') {
    throw new BadRequestException('employee_store_id_is_required');
  }
  if (!employee.position || employee.position.trim() === '') {
    throw new BadRequestException('employee_position_is_required');
  }
}

export function validateEmployeeUpdateData(employee: Employee, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!employee) {
    throw new BadRequestException('employee_data_is_required');
  }
  if (employee.userId && employee.userId.trim() === '') {
    throw new BadRequestException('employee_user_id_is_required');
  }
  if (employee.storeId && employee.storeId.trim() === '') {
    throw new BadRequestException('employee_store_id_is_required');
  }
  if (employee.position && employee.position.trim() === '') {
    throw new BadRequestException('employee_position_is_required');
  }
}

export function validateEmployeeDelete(employeeId: string, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!employeeId || employeeId.trim() === '') {
    throw new BadRequestException('employee_id_is_required');
  }
}

//////////////////////////////////////////////
/**                 StoreManager                   */
//////////////////////////////////////////////
export function validateStoreManagerData(storeManager: StoreManager, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!storeManager) {
    throw new BadRequestException('store_manager_data_is_required');
  }
  if (!storeManager.userId || storeManager.userId.trim() === '') {
    throw new BadRequestException('store_manager_user_id_is_required');
  }
  if (!storeManager.storeId || storeManager.storeId.trim() === '') {
    throw new BadRequestException('store_manager_store_id_is_required');
  }
}

export function validateStoreManagerUpdateData(storeManager: StoreManager, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!storeManager) {
    throw new BadRequestException('store_manager_data_is_required');
  }
  if (storeManager.userId && storeManager.userId.trim() === '') {
    throw new BadRequestException('store_manager_user_id_is_required');
  }
  if (storeManager.storeId && storeManager.storeId.trim() === '') {
    throw new BadRequestException('store_manager_store_id_is_required');
  }
}

export function validateStoreManagerDelete(storeManagerId: string, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!storeManagerId || storeManagerId.trim() === '') {
    throw new BadRequestException('store_manager_id_is_required');
  }
}

//////////////////////////////////////////////
/**                 Customer                   */
//////////////////////////////////////////////
export function validateCustomerData(customer: Customer, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!customer) {
    throw new BadRequestException('customer_data_is_required');
  }
  if (!customer.userId || customer.userId.trim() === '') {
    throw new BadRequestException('customer_user_id_is_required');
  }
  if (!customer.storeId || customer.storeId.trim() === '') {
    throw new BadRequestException('customer_store_id_is_required');
  }
}

export function validateCustomerUpdateData(customer: Customer, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!customer) {
    throw new BadRequestException('customer_data_is_required');
  }
  if (customer.userId && customer.userId.trim() === '') {
    throw new BadRequestException('customer_user_id_is_required');
  }
  if (customer.storeId && customer.storeId.trim() === '') {
    throw new BadRequestException('customer_store_id_is_required');
  }
}

export function validateCustomerDelete(customerId: string, user: User): void {
  if (!user) {
    throw new UnauthorizedException('user_not_authenticated');
  }
  if (!user.id) {
    throw new UnauthorizedException('user_id_is_required');
  }
  if (!user.role || user.role !== ADMIN_ROLE) {
    throw new UnauthorizedException('user_not_authorized');
  }

  if (!customerId || customerId.trim() === '') {
    throw new BadRequestException('customer_id_is_required');
  }
}