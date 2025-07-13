interface User {
  id: string; // Unique identifier for the user

  email: string; // User's email address
  avatar?: string; // URL to the user's avatar image
  username: string; // User's username or display name
  fullname: string; // User's full name
  role: string; // User's role in the system (e.g., 'admin', 'user', etc.)
  isActive: boolean; // Indicates if the user is active or not
  createdAt: Date; // Timestamp of when the user was created
  updatedAt: Date; // Timestamp of when the user was last updated
}

interface StoreManager {
  id: string; // Unique identifier for the store manager
  storeId: string; // Reference to the store managed by this manager
  userId: string; // Reference to the user associated with this store manager
  createdAt: Date; // Timestamp of when the store manager was created
  updatedAt: Date; // Timestamp of when the store manager was last updated
  store: Store; // Reference to the store managed by this manager
  user: User; // Reference to the user associated with this store manager
}

interface Employee {
  id: string; // Unique identifier for the employee
  userId: string; // Reference to the user associated with this employee
  storeId: string;  // Reference to the store where the employee works
  position: string; // Employee's position or job title
  createdAt: Date;  // Timestamp of when the employee was created
  updatedAt: Date;  // Timestamp of when the employee was last updated
}

interface Customer {
  id: string; // Unique identifier for the customer
  userId: string; // Reference to the user associated with this customer
  storeId: string; // Reference to the store where the customer is registered
  loyaltyPoints: number; // Number of loyalty points the customer has
  createdAt: Date; // Timestamp of when the customer was created
  updatedAt: Date; // Timestamp of when the customer was last updated
  isActive: boolean; // Indicates if the customer is active or not
  phoneNumber?: string; // Optional phone number for the customer
  address?: string; // Optional address for the customer
  notes?: string; // Optional notes about the customer
  lastPurchaseDate?: Date; // Optional date of the last purchase made by the customer
  totalSpent?: number; // Optional total amount spent by the customer
}

interface ProductType {
  id: string; // Unique identifier for the product type
  name: string; // Name of the product type
  description?: string; // Optional description of the product type
  createdAt: Date; // Timestamp of when the product type was created
  updatedAt: Date; // Timestamp of when the product type was last updated

  products?: Product[]; // Optional array of products associated with this product type
}

interface Product {
  id: string; // Unique identifier for the product
  name: string; // Name of the product
  description?: string; // Optional description of the product
  price: number; // Price of the product
  stock: number; // Current stock level of the product
  imageUrl?: string; // Optional URL to an image of the product
  createdAt: Date; // Timestamp of when the product was created
  updatedAt: Date; // Timestamp of when the product was last updated
  
  storeId: string; // Reference to the store where the product is available
  store?: Store; // Optional reference to the store object

  categories?: ProductType[]; // Optional array of product types/categories associated with this product
}

interface InventoryTransaction {
  id: string; // Unique identifier for the inventory transaction
  productId: string; // Reference to the product involved in the transaction
  quantity: number; // Quantity of the product involved in the transaction
  type: string;
  createdAt: Date; // Timestamp of when the transaction was created
  updatedAt: Date; // Timestamp of when the transaction was last updated

  product?: Product; // Optional reference to the product object
}

interface Order {
  id: string; // Unique identifier for the order
  storeId: string; // Reference to the store where the order was placed
  userId: string; // Reference to the user who placed the order
  total: number; // Total amount for the order
  status: string; // Status of the order (e.g., 'pending', 'completed', etc.)
  createdAt: Date; // Timestamp of when the order was created
  updatedAt: Date; // Timestamp of when the order was last updated

  store?: Store; // Optional reference to the store object
  user?: User; // Optional reference to the user object
  oderItems?: OrderItem[]; // Optional array of order items associated with this order
}

interface OrderItem {
  id: string; // Unique identifier for the order item
  orderId: string; // Reference to the order this item belongs to
  productId: string; // Reference to the product being ordered
  quantity: number; // Quantity of the product ordered
  price: number; // Price of the product at the time of the order
  createdAt: Date; // Timestamp of when the order item was created
  updatedAt: Date; // Timestamp of when the order item was last updated

  order?: Order; // Optional reference to the order object
  product?: Product; // Optional reference to the product object
}

interface ShiftHandover {
  id: string; // Unique identifier for the shift handover
  storeId: string; // Reference to the store where the shift handover took place
  shiftStartTime: Date; // Timestamp of when the shift started
  shiftEndTime: Date; // Timestamp of when the shift ended
  revenueCollected: number; // Total revenue collected during the shift
  expenses: number; // Total expenses incurred during the shift
  amountHandedOver: number; // Amount handed over at the end of the shift
  notes: string; // Optional notes about the shift handover
  numberOfItemsSold: number; // Number of items sold during the shift
  createdAt: Date; // Timestamp of when the shift handover was created
  updatedAt: Date; // Timestamp of when the shift handover was last updated

  store?: Store; // Optional reference to the store object
  employee?: Employee; // Optional reference to the employee object
}

interface Store {
  id: string; // Unique identifier for the store
  name: string; // Name of the store
  address: string; // Address of the store
  phone: string; // Phone number of the store
  email: string; // Email address of the store
  description: string; // Description of the store
  imageUrl: string; // URL to an image of the store
  ownerId: string; // Reference to the user who owns the store
  createdAt: Date; // Timestamp of when the store was created
  updatedAt: Date; // Timestamp of when the store was last updated

  owner?: User; // Optional reference to the owner user object
  managers?: StoreManager[]; // Optional array of store managers
  employees?: Employee[]; // Optional array of employees working in the store
  customers?: Customer[]; // Optional array of customers associated with the store
  products?: Product[]; // Optional array of products available in the store
  shifts?: ShiftHandover[]; // Optional array of shift handovers for the store
}

interface UserFirebase {
  uid: string; // Unique identifier for the Firebase user
  email: string;  // User's email address
  email_verified: boolean;  // Indicates if the user's email is verified
  name: string; // User's full name
  picture: string;  // URL to the user's profile picture
  iss: string;  // Issuer of the token (usually Firebase)
  aud: string;  // Audience for the token (usually the Firebase project ID)
  auth_time: number;  // Timestamp of when the user authenticated
  user_id: string;  // User's unique identifier in Firebase
  sub: string;  // Subject of the token (usually the same as uid)
  iat: number;  // Issued at time of the token
  exp: number;  // Expiration time of the token
  firebase?: {
    identities?: Record<string, string[]>;  // OAuth identities associated with the user
    sign_in_provider?: string;  // Sign-in provider used (e.g., 'password', 'google', etc.)
  };
  // Additional fields can be added as needed
  // For example, if you want to include phone number or other OAuth-specific fields
  phone_number?: string;  // User's phone number (if available)
  provider_id?: string; // Identifier for the OAuth provider (if applicable)
  provider_data?: Array<{
    providerId: string;
    uid: string;
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
  }>;
  // Note: The above fields are optional and depend on the OAuth provider's response
}

export { 
  User,
  StoreManager,
  Employee,
  Customer,
  ProductType,
  Product,
  InventoryTransaction,
  Order,
  OrderItem,
  ShiftHandover,
  Store,
  UserFirebase
};