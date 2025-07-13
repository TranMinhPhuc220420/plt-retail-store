import { UnauthorizedException, BadRequestException } from '@nestjs/common';

import { isValidEmail } from '@/utils';

// Interface for store data validation
import { User, Store } from '@/interfaces';

// Constants
import { ADMIN_ROLE } from '@/config';

// interface Store {
//   id: string; // Unique identifier for the store
//   name: string; // Name of the store
//   address: string; // Address of the store
//   phone: string; // Phone number of the store
//   email: string; // Email address of the store
//   description: string; // Description of the store
//   imageUrl: string; // URL to an image of the store
//   ownerId: string; // Reference to the user who owns the store
//   createdAt: Date; // Timestamp of when the store was created
//   updatedAt: Date; // Timestamp of when the store was last updated

//   owner?: User; // Optional reference to the owner user object
//   managers?: StoreManager[]; // Optional array of store managers
//   employees?: Employee[]; // Optional array of employees working in the store
//   customers?: Customer[]; // Optional array of customers associated with the store
//   products?: Product[]; // Optional array of products available in the store
//   shifts?: ShiftHandover[]; // Optional array of shift handovers for the store
// }
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
    throw new BadRequestException('store_image_url_is_required');
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
    throw new BadRequestException('store_image_url_is_required');
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