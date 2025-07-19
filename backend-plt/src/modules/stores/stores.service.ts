import { Injectable, UnauthorizedException, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';

// Entity imports
import { Store as StoreEntity } from '@/entities/Store';

// Interface imports
import { Store, User } from '@/interfaces';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private TIME_CACHE = 60 * 60 * 24; // 24 hours

  /**
   * Helper method to map StoreEntity to Store interface
   */
  private mapEntityToStore(entity: StoreEntity): Store {
    return {
      id: entity.id,
      name: entity.name,
      storeCode: entity.storeCode,
      address: entity.address,
      phone: entity.phone,
      email: entity.email,
      description: entity.description,
      imageUrl: entity.imageUrl,
      ownerId: entity.ownerId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      customers: entity.customers?.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
        isActive: customer.isActive,
        userId: customer.userId,
        storeId: customer.storeId,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      })) ?? [],
    };
  }

  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////

  async getAllStores(): Promise<Store[]> {
    const cacheKey = 'stores:all';
    const cached = await this.cacheManager.get<Store[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeEntities = await this.storeRepository.find();
    const stores: Store[] = storeEntities.map(entity => this.mapEntityToStore(entity));
    
    await this.cacheManager.set(cacheKey, stores, this.TIME_CACHE);
    return stores;
  }

  async getStoreById(id: string): Promise<Store | null> {
    const cacheKey = `stores:${id}`;
    const cached = await this.cacheManager.get<Store>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeEntity = await this.storeRepository.findOne({ where: { id } });
    if (!storeEntity) {
      return null;
    }

    const store = this.mapEntityToStore(storeEntity);
    await this.cacheManager.set(cacheKey, store, this.TIME_CACHE);
    return store;
  }

  async getMyStoreByStoreCode(user: User, storeCode: string, cache: boolean = true): Promise<Store | null> {
    if (!user?.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-store:${user.id}:${storeCode}`;
    if (cache) {
      const cached = await this.cacheManager.get<Store>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const storeEntity = await this.storeRepository.findOne({
      where: { storeCode, ownerId: user.id },
    });

    if (!storeEntity) {
      return null;
    }

    const store = this.mapEntityToStore(storeEntity);
    await this.cacheManager.set(cacheKey, store, this.TIME_CACHE);
    return store;
  }

  async searchStores(params: { name?: string; storeCode?: string; phone?: string; email?: string }): Promise<Store[]> {
    const queryOr: any[] = [];
    
    if (params.name) {
      queryOr.push({ name: Like(`%${params.name}%`) });
    }
    if (params.storeCode) {
      queryOr.push({ storeCode: Like(`%${params.storeCode}%`) });
    }
    if (params.phone) {
      queryOr.push({ phone: Like(`%${params.phone}%`) });
    }
    if (params.email) {
      queryOr.push({ email: Like(`%${params.email}%`) });
    }

    if (queryOr.length === 0) {
      return [];
    }

    const storeEntities = await this.storeRepository.find({
      where: queryOr,
    });

    return storeEntities.map(entity => this.mapEntityToStore(entity));
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific store management */
  ////////////////////////////////////////////////////////////

  async createMyStore(user: User, data: Store): Promise<Store> {
    if (!user?.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const store = this.storeRepository.create({
      name: data.name,
      storeCode: data.storeCode,
      address: data.address,
      phone: data.phone,
      email: data.email,
      description: data.description,
      imageUrl: data.imageUrl,
      ownerId: user.id, // Use user.id instead of data.ownerId for security
    });

    const savedStoreEntity = await this.storeRepository.save(store);
    const savedStore = this.mapEntityToStore(savedStoreEntity);

    // Invalidate related caches
    await this.invalidateStoreCaches(user.id, savedStore.id);

    return savedStore;
  }

  async updateMyStore(user: User, id: string, data: Partial<Store>): Promise<Store> {
    if (!user?.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    // Verify ownership
    const existingStore = await this.storeRepository.findOne({ 
      where: { id, ownerId: user.id } 
    });
    if (!existingStore) {
      throw new NotFoundException('Store not found or access denied');
    }

    const { ownerId, id: storeId, owner, managers, customers, shifts, products, employees, ...updateData } = data;
    
    await this.storeRepository.update({ id }, updateData);
    const updatedEntity = await this.storeRepository.findOne({ where: { id } });
    
    if (!updatedEntity) {
      throw new NotFoundException('Store not found after update');
    }

    const store = this.mapEntityToStore(updatedEntity);

    // Invalidate related caches
    await this.invalidateStoreCaches(user.id, id);

    return store;
  }

  async deleteMyStore(user: User, id: string): Promise<Store> {
    if (!user?.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    // Verify ownership and get store before deletion
    const storeEntity = await this.storeRepository.findOne({ 
      where: { id, ownerId: user.id } 
    });
    if (!storeEntity) {
      throw new NotFoundException('Store not found or access denied');
    }

    const store = this.mapEntityToStore(storeEntity);
    await this.storeRepository.delete({ id });

    // Invalidate related caches
    await this.invalidateStoreCaches(user.id, id);

    return store;
  }

  async getMyStores(user: User, cache: boolean = true): Promise<Store[]> {
    if (!user?.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-stores:${user.id}`;
    
    if (cache) {
      const cached = await this.cacheManager.get<Store[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const storeEntities = await this.storeRepository.find({
      where: { ownerId: user.id },
      order: { createdAt: 'DESC' },
    });

    const stores = storeEntities.map(entity => this.mapEntityToStore(entity));

    // Cache the fetched stores
    await this.cacheManager.set(cacheKey, stores, this.TIME_CACHE);

    return stores;
  }

  async getMyStoreById(user: User, storeId: string, cache: boolean = true): Promise<Store | null> {
    if (!user?.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-stores:${user.id}:${storeId}`;

    // Check cache first
    if (cache) {
      const cached = await this.cacheManager.get<Store>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const storeEntity = await this.storeRepository.findOne({
      where: { id: storeId, ownerId: user.id },
    });

    if (!storeEntity) {
      return null;
    }

    const store = this.mapEntityToStore(storeEntity);

    // Cache the fetched store
    await this.cacheManager.set(cacheKey, store, this.TIME_CACHE);

    return store;
  }

  private async invalidateStoreCaches(ownerId?: string, storeId?: string): Promise<void> {
    const keys = [
      'stores:all',
      ...(ownerId ? [`my-stores:${ownerId}`] : []),
      ...(storeId ? [`stores:${storeId}`] : []),
      ...(ownerId && storeId ? [`my-stores:${ownerId}:${storeId}`] : []),
    ];

    // Also invalidate store code cache patterns
    if (ownerId) {
      // Note: This is a simplified approach. In production, you might want to 
      // track store codes separately or use cache tags
      const userStores = await this.storeRepository.find({ 
        where: { ownerId },
        select: ['storeCode']
      });
      
      userStores.forEach(store => {
        keys.push(`my-store:${ownerId}:${store.storeCode}`);
      });
    }

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}