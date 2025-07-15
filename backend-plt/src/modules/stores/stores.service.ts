import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Service imports
import { PrismaService } from '@/database/prisma.service';

// Interface imports
import { Store, User } from '@/interfaces';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private TIME_CACHE = 60 * 60 * 24; // 24 hours

  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////

  async getAllStores(): Promise<Store[]> {
    const cacheKey = 'stores:all';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as Store[];
    }

    const stores = await this.prisma.store.findMany() as Store[];
    await this.cacheManager.set(cacheKey, stores, this.TIME_CACHE);
    return stores;
  }

  async getStoreById(id: string): Promise<Store | null> {
    const cacheKey = `stores:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as Store;
    }

    const store = await this.prisma.store.findUnique({ where: { id } }) as Store | null;
    if (store) {
      await this.cacheManager.set(cacheKey, store, this.TIME_CACHE);
    }
    return store;
  }

  async getMyStoreByStoreCode(user: User, storeCode: string, cache: boolean = true): Promise<Store | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-store:${user.id}:${storeCode}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Store;
      }
    }

    const store = await this.prisma.store.findFirst({
      where: { storeCode, ownerId: user.id },
    }) as Store;

    if (store) {
      await this.cacheManager.set(cacheKey, store, this.TIME_CACHE);
    }

    return store;
  }

  async searchStores(params: object): Promise<Store[]> {
    let queryOr: any[] = [];
    if (params['name']) {
      queryOr.push({ name: { contains: params['name'], mode: 'insensitive' } });
    }
    if (params['storeCode']) {
      queryOr.push({ storeCode: { contains: params['storeCode'], mode: 'insensitive' } });
    }
    if (params['phone']) {
      queryOr.push({ phone: { contains: params['phone'], mode: 'insensitive' } });
    }
    if (params['email']) {
      queryOr.push({ email: { contains: params['email'], mode: 'insensitive' } });
    }

    // Implement search logic here, e.g., using Prisma's findMany with filters
    const stores = await this.prisma.store.findMany({
      where: {
        OR: queryOr,
      },
    }) as Store[];

    return stores;
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific store management */
  ////////////////////////////////////////////////////////////

  async createMyStore(user: User, data: Store): Promise<Store> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    // Create the store with the provided data
    const store = await this.prisma.store.create({
      data: {
        name: data.name,
        storeCode: data.storeCode,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        imageUrl: data.imageUrl,
        ownerId: data.ownerId,
      },
    }) as Store;

    // Invalidate related caches
    await this.invalidateStoreCaches(user.id, store.id);

    return store;
  }

  async updateMyStore(user: User, id: string, data: Partial<any>): Promise<Store> {
    const { ownerId, ...updateData } = data;
    const store = await this.prisma.store.update({
      where: { id },
      data: updateData,
    }) as Store;

    // Invalidate related caches
    await this.invalidateStoreCaches(user.id, id);

    return store;
  }

  async deleteMyStore(user: User, id: string): Promise<Store> {
    const store = await this.prisma.store.delete({
      where: { id },
    }) as Store;

    // Invalidate related caches
    await this.invalidateStoreCaches(user.id, id);

    return store;
  }

  async getMyStores(user: User, cache: boolean = true): Promise<Store[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    } 

    const cacheKey = `my-stores:${user.id}`;
    
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Store[];
      }
    }

    const stores = await this.prisma.store.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    }) as Store[];

    // Cache the fetched stores
    await this.cacheManager.set(cacheKey, stores, this.TIME_CACHE);

    return stores;
  }

  async getMyStoreById(user: User, storeId: string, cache: boolean = true): Promise<Store | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-stores:${user.id}:${storeId}`;

    // Check cache first
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Store;
      }
    }

    const store = await this.prisma.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    }) as Store;

    if (store) {
      // Cache the fetched store
      await this.cacheManager.set(cacheKey, store, this.TIME_CACHE);
    }

    return store;
  }

  private async invalidateStoreCaches(ownerId?: string, storeId?: string) {
    const keys = [
      'stores:all',
      ...(ownerId ? [`my-stores:${ownerId}`] : []),
      ...(ownerId ? [`my-store:${ownerId}`] : []),
      ...(storeId ? [`stores:${storeId}`] : []),
      ...(ownerId && storeId ? [`my-stores:${ownerId}:${storeId}`] : []),
    ];

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}