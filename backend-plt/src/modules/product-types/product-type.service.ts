import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entity imports
import { ProductType as ProductTypeEntity } from '@/entities/ProductType';
import { Store as StoreEntity } from '@/entities/Store';

// Interface imports
import { ProductType, Store, User } from '@/interfaces';

@Injectable()
export class ProductTypeService {
  constructor(
    @InjectRepository(ProductTypeEntity)
    private readonly productTypeRepository: Repository<ProductTypeEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Helper method to map ProductTypeEntity to ProductType interface
   */
  private mapEntityToProductType(entity: ProductTypeEntity): ProductType {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      storeId: entity.storeId,
      ownerId: entity.ownerId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

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
    };
  }

  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////
  async getAllProductTypes(): Promise<ProductType[]> {
    const cacheKey = 'product-types:all';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ProductType[];
    }

    const productTypeEntities = await this.productTypeRepository.find();
    const productTypes = productTypeEntities.map(entity => this.mapEntityToProductType(entity));
    await this.cacheManager.set(cacheKey, productTypes, 300000); // 5 minutes
    return productTypes;
  }

  async getProductTypeById(id: string): Promise<ProductType | null> {
    const cacheKey = `product-types:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ProductType;
    }

    const productTypeEntity = await this.productTypeRepository.findOne({ where: { id } });
    if (!productTypeEntity) {
      return null;
    }

    const productType = this.mapEntityToProductType(productTypeEntity);
    await this.cacheManager.set(cacheKey, productType, 300000); // 5 minutes
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

    const storeEntity = await this.storeRepository.findOne({ where: { storeCode } });
    if (!storeEntity) {
      return null;
    }

    const store = this.mapEntityToStore(storeEntity);
    await this.cacheManager.set(cacheKey, store, 300000); // 5 minutes
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

    const productTypeEntities = await this.productTypeRepository.find({
      where: { ownerId: user.id, storeId },
      order: { updatedAt: 'DESC' },
    });

    const productTypes = productTypeEntities.map(entity => this.mapEntityToProductType(entity));

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

    const productTypeEntity = await this.productTypeRepository.findOne({
      where: { id: productTypeId, ownerId: user.id },
    });

    if (!productTypeEntity) {
      return null;
    }

    const productType = this.mapEntityToProductType(productTypeEntity);

    // Cache the fetched product type
    await this.cacheManager.set(cacheKey, productType, 300000); // 5 minutes

    return productType;
  }

  async createProductType(data: ProductType): Promise<ProductType> {
    const productTypeEntity = this.productTypeRepository.create({
      name: data.name,
      description: data.description,
      storeId: data.storeId,
      ownerId: data.ownerId,
    });

    const savedEntity = await this.productTypeRepository.save(productTypeEntity);
    const productType = this.mapEntityToProductType(savedEntity);

    // Invalidate related caches
    await this.invalidateProductTypeCaches(data.ownerId, undefined, data.storeId);

    return productType;
  }

  async createProductTypesBulk(store: Store, user: User, data: ProductType[]): Promise<ProductType[]> {
    const productTypeEntities = data.map(pt => this.productTypeRepository.create({
      name: pt.name,
      description: pt.description,
      storeId: pt.storeId,
      ownerId: pt.ownerId,
    }));

    await this.productTypeRepository.save(productTypeEntities);

    // Invalidate related caches
    await this.invalidateProductTypeCaches(user.id);

    return this.getMyProductTypes(user, store.id, false); // Return the updated list without cache
  }

  async updateProductType(id: string, data: Partial<ProductType>): Promise<ProductType> {
    const { ownerId, store, owner, products, ...updateData } = data;
    
    await this.productTypeRepository.update({ id }, updateData);
    const updatedEntity = await this.productTypeRepository.findOne({ where: { id } });
    
    if (!updatedEntity) {
      throw new Error('ProductType not found after update');
    }

    const productType = this.mapEntityToProductType(updatedEntity);

    // Invalidate related caches
    await this.invalidateProductTypeCaches(ownerId, id, productType.storeId);

    return productType;
  }

  async deleteProductType(id: string): Promise<ProductType> {
    // Get product type details before deletion for cache invalidation
    const productTypeEntity = await this.productTypeRepository.findOne({ where: { id } });
    
    if (!productTypeEntity) {
      throw new Error('ProductType not found');
    }

    const productType = this.mapEntityToProductType(productTypeEntity);
    await this.productTypeRepository.delete({ id });

    // Invalidate related caches
    await this.invalidateProductTypeCaches(productType.ownerId, id, productType.storeId);

    return productType;
  }

  private async invalidateProductTypeCaches(ownerId?: string, productTypeId?: string, storeId?: string) {
    const keys = [
      'product-types:all',
      ...(ownerId ? [`my-product-types:${ownerId}`] : []),
      ...(storeId ? [`my-product-types:${ownerId}:${storeId}`] : []),
      ...(productTypeId ? [`product-types:${productTypeId}`] : []),
      ...(ownerId && productTypeId ? [`my-product-types:${ownerId}:${productTypeId}`] : []),
      ...(storeId ? [`store:${storeId}`] : []),
    ];

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}