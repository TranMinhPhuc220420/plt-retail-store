import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Service imports
import { PrismaService } from '@/database/prisma.service';

// Interface imports
import { ProductType, Store, User } from '@/interfaces';

@Injectable()
export class ProductTypeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////
  async getAllProductTypes(): Promise<ProductType[]> {
    const cacheKey = 'product-types:all';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ProductType[];
    }

    const productTypes = await this.prisma.productType.findMany() as ProductType[];
    await this.cacheManager.set(cacheKey, productTypes, 300000); // 5 minutes
    return productTypes;
  }

  async getProductTypeById(id: string): Promise<ProductType | null> {
    const cacheKey = `product-types:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ProductType;
    }

    const productType = await this.prisma.productType.findUnique({ where: { id } }) as ProductType | null;
    if (productType) {
      await this.cacheManager.set(cacheKey, productType, 300000); // 5 minutes
    }
    return productType;
  }

  ////////////////////////////////////////////////////////////
  /**              Relationship with Store                  */
  ////////////////////////////////////////////////////////////
  async getMyStoreByCode(user: User, storeCode: string, cache: boolean = true): Promise<Store | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `store:${storeCode}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Store;
      }
    }

    const store = await this.prisma.store.findUnique({ where: { storeCode: storeCode } }) as Store | null;
    if (store) {
      await this.cacheManager.set(cacheKey, store, 300000); // 5 minutes
    }
    return store;
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific store management */
  ////////////////////////////////////////////////////////////

  async getMyProductTypes(user: User, storeId: string, cache: boolean = true): Promise<ProductType[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-product-types:${user.id}:${storeId}`;

    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as ProductType[];
      }
    }

    const productTypes = await this.prisma.productType.findMany({
      where: { ownerId: user.id, storeId: storeId },
      orderBy: { updatedAt: 'desc' },
    }) as ProductType[];

    // Cache the fetched product types
    await this.cacheManager.set(cacheKey, productTypes, 300000); // 5 minutes

    return productTypes;
  }

  async getMyProductTypeById(user: User, productTypeId: string, cache: boolean = true): Promise<ProductType | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-product-types:${user.id}:${productTypeId}`;

    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as ProductType;
      }
    }

    const productType = await this.prisma.productType.findFirst({
      where: { id: productTypeId, ownerId: user.id },
    }) as ProductType | null;

    if (productType) {
      // Cache the fetched product type
      await this.cacheManager.set(cacheKey, productType, 300000); // 5 minutes
    }

    return productType;
  }

  async createProductType(data: ProductType): Promise<ProductType> {
    const productType = await this.prisma.productType.create({
      data: {
        name: data.name,
        description: data.description,
        storeId: data.storeId, // Ensure storeId is included
        ownerId: data.ownerId,
      },
    }) as ProductType;

    // Invalidate related caches
    await this.invalidateProductTypeCaches(data.ownerId, undefined, data.storeId);

    return productType;
  }

  async createProductTypesBulk(store: Store, user: User, data: ProductType[]): Promise<ProductType[]> {
    const productTypes = await this.prisma.productType.createMany({
      data: data.map(pt => ({
        name: pt.name,
        description: pt.description,
        storeId: pt.storeId,
        ownerId: pt.ownerId,
      })),
      skipDuplicates: true,
    });

    // Invalidate related caches
    await this.invalidateProductTypeCaches(user.id);

    return this.getMyProductTypes(user, store.id, false); // Return the updated list without cache
  }

  async updateProductType(id: string, data: Partial<any>): Promise<ProductType> {
    const { ownerId, ...updateData } = data;
    const productType = await this.prisma.productType.update({
      where: { id },
      data: updateData,
    }) as ProductType;

    // Invalidate related caches
    await this.invalidateProductTypeCaches(ownerId, id, productType.storeId);

    return productType;
  }

  async deleteProductType(id: string): Promise<ProductType> {
    // Get product type details before deletion for cache invalidation
    const productType = await this.prisma.productType.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    const result = await this.prisma.productType.delete({
      where: { id },
    }) as ProductType;

    // Invalidate related caches
    if (productType) {
      await this.invalidateProductTypeCaches(productType.ownerId, id, result.storeId);
    }

    return result;
  }

  private async invalidateProductTypeCaches(ownerId?: string, productTypeId?: string, storeId?: string) {
    const keys = [
      'product-types:all',
      ...(ownerId ? [`my-product-types:${ownerId}`] : []),
      ...(storeId ? [`my-product-types:${ownerId}:${storeId}`] : []),
      ...(productTypeId ? [`product-types:${productTypeId}`] : []),
      ...(ownerId && productTypeId ? [`my-product-types:${ownerId}:${productTypeId}`] : []),
      ...(storeId ? [`store:${storeId}`] : []), // Include store cache key
    ];

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}