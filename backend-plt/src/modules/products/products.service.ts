import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entity imports
import { Product as ProductEntity } from '@/entities/Product';
import { ProductType as ProductTypeEntity } from '@/entities/ProductType';
import { Store as StoreEntity } from '@/entities/Store';

// Interface imports
import { Product, ProductType, Store, User } from '@/interfaces';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductTypeEntity)
    private readonly productTypeRepository: Repository<ProductTypeEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Helper method to map ProductEntity to Product interface
   */
  private mapEntityToProduct(entity: ProductEntity): Product {
    return {
      id: entity.id,
      productCode: entity.productCode,
      name: entity.name,
      description: entity.description,
      imageUrl: entity.imageUrl,
      price: entity.price,
      retailPrice: entity.retailPrice,
      wholesalePrice: entity.wholesalePrice,
      costPrice: entity.costPrice,
      stock: entity.stock,
      minStock: entity.minStock,
      unit: entity.unit,
      status: entity.status,
      ownerId: entity.ownerId,
      storeId: entity.storeId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      categories: entity.categories?.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        storeId: cat.storeId,
        ownerId: cat.ownerId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })) ?? [],
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

  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////

  async getAllProducts(): Promise<Product[]> {
    const cacheKey = 'products:all';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as Product[];
    }

    const productEntities = await this.productRepository.find({
      relations: ['store', 'owner', 'categories', 'images'],
    });

    const products = productEntities.map(entity => this.mapEntityToProduct(entity));
    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `products:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as Product;
    }

    const productEntity = await this.productRepository.findOne({
      where: { id },
      relations: ['store', 'owner', 'categories', 'images'],
    });

    if (!productEntity) {
      return null;
    }

    const product = this.mapEntityToProduct(productEntity);
    await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes
    return product;
  }

  async createProduct(data: Product): Promise<Product> {
    const productEntity = this.productRepository.create({
      productCode: data.productCode,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      price: data.price,
      retailPrice: data.retailPrice,
      wholesalePrice: data.wholesalePrice,
      costPrice: data.costPrice,
      stock: data.stock,
      minStock: data.minStock,
      unit: data.unit,
      status: data.status,
      ownerId: data.ownerId,
      storeId: data.storeId,
    });

    // Handle categories if provided
    if (data.categories && data.categories.length > 0) {
      const categories = await this.productTypeRepository.findByIds(
        data.categories.map(cat => cat.id)
      );
      productEntity.categories = categories;
    }

    const savedEntity = await this.productRepository.save(productEntity);
    const savedProduct = await this.productRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['store', 'owner', 'categories'],
    });

    const product = this.mapEntityToProduct(savedProduct!);

    // Invalidate related caches
    await this.invalidateProductCaches(data.ownerId, data.storeId);

    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const { ownerId, owner, store, categories, ...updateData } = data;

    await this.productRepository.update({ id }, updateData);

    // Handle categories update if provided
    if (categories) {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['categories'],
      });
      
      if (product) {
        const newCategories = await this.productTypeRepository.findByIds(
          categories.map(cat => cat.id)
        );
        product.categories = newCategories;
        await this.productRepository.save(product);
      }
    }

    const updatedEntity = await this.productRepository.findOne({
      where: { id },
      relations: ['store', 'owner', 'categories'],
    });

    if (!updatedEntity) {
      throw new Error('Product not found after update');
    }

    const product = this.mapEntityToProduct(updatedEntity);

    // Invalidate related caches
    await this.invalidateProductCaches(product.ownerId, product.storeId, id);

    return product;
  }

  async deleteProduct(id: string): Promise<Product> {
    // Get product details before deletion for cache invalidation
    const productEntity = await this.productRepository.findOne({ where: { id } });
    
    if (!productEntity) {
      throw new Error('Product not found');
    }

    const product = this.mapEntityToProduct(productEntity);
    await this.productRepository.delete({ id });

    // Invalidate related caches
    await this.invalidateProductCaches(product.ownerId, product.storeId, id);

    return product;
  }

  ////////////////////////////////////////////////////////////
  /**              Relationship with Store                  */
  ////////////////////////////////////////////////////////////

  async getMyStoreById(user: User, storeId: string, cache: boolean = true): Promise<Store | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-store:${user.id}:${storeId}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Store;
      }
    }

    const storeEntity = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['owner'],
    });
    
    if (!storeEntity) {
      return null;
    }

    const store = this.mapEntityToStore(storeEntity);
    await this.cacheManager.set(cacheKey, store, 300000); // 5 minutes
    return store;
  }

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

  async getCategoryById(user: User, storeId: string, categoryId?: string): Promise<ProductType | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }
    if (!storeId) {
      throw new UnauthorizedException('store_id_is_required');
    }
    if (!categoryId) {
      throw new UnauthorizedException('category_id_is_required');
    }

    const cacheKey = `category:${categoryId}:store:${storeId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as ProductType;
    }

    const productTypeEntity = await this.productTypeRepository.findOne({
      where: { id: categoryId, storeId },
      relations: ['store', 'owner', 'products'],
    });

    if (!productTypeEntity) {
      return null;
    }

    const productType = this.mapEntityToProductType(productTypeEntity);
    await this.cacheManager.set(cacheKey, productType, 300000); // 5 minutes

    return productType;
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific store management */
  ////////////////////////////////////////////////////////////

  async getMyProducts(user: User, storeId: string, cache: boolean = true): Promise<Product[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}:store:${storeId}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Product[];
      }
    }

    const productEntities = await this.productRepository.find({
      where: { ownerId: user.id, storeId },
      relations: ['store', 'categories', 'images'],
      order: { updatedAt: 'DESC' },
    });

    const products = productEntities.map(entity => this.mapEntityToProduct(entity));
    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async getMyProductById(user: User, productId: string, cache: boolean = true): Promise<Product | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}:${productId}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Product;
      }
    }

    const productEntity = await this.productRepository.findOne({
      where: { id: productId, ownerId: user.id },
      relations: ['store', 'categories', 'images'],
    });

    if (!productEntity) {
      return null;
    }

    const product = this.mapEntityToProduct(productEntity);
    await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes
    return product;
  }

  async getMyProductByProductCode(user: User, productCode: string, cache: boolean = true): Promise<Product | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}:code:${productCode}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Product;
      }
    }

    const productEntity = await this.productRepository.findOne({
      where: { productCode, ownerId: user.id },
      relations: ['store', 'categories', 'images'],
    });
    
    if (!productEntity) {
      return null;
    }

    const product = this.mapEntityToProduct(productEntity);
    await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes

    return product;
  }

  async getProductsByStore(user: User, storeId: string, cache: boolean = true): Promise<Product[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `products:store:${storeId}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Product[];
      }
    }

    const productEntities = await this.productRepository.find({
      where: { storeId },
      relations: ['categories', 'images'],
      order: { updatedAt: 'DESC' },
    });

    const products = productEntities.map(entity => this.mapEntityToProduct(entity));
    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async getMyProductsByStore(user: User, storeId: string, cache: boolean = true): Promise<Product[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}:store:${storeId}`;
    if (cache) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached as Product[];
      }
    }

    const productEntities = await this.productRepository.find({
      where: { storeId, ownerId: user.id },
      relations: ['store', 'categories', 'images'],
      order: { updatedAt: 'DESC' },
    });

    const products = productEntities.map(entity => this.mapEntityToProduct(entity));
    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async createProductsBulk(store: Store, user: User, data: Product[]): Promise<Product[]> {
    const productEntities = data.map(product => this.productRepository.create({
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      status: product.status,
      ownerId: product.ownerId,
      storeId: product.storeId,
    }));

    await this.productRepository.save(productEntities);

    // Invalidate related caches
    await this.invalidateProductCaches(user.id, store.id);

    return this.getMyProductsByStore(user, store.id, false); // Return the updated list without cache
  }

  private async invalidateProductCaches(ownerId?: string, storeId?: string, productId?: string) {
    const keys = [
      'products:all',
      ...(ownerId ? [`my-products:${ownerId}`] : []),
      ...(storeId ? [`products:store:${storeId}`] : []),
      ...(ownerId && storeId ? [`my-products:${ownerId}:store:${storeId}`] : []),
      ...(productId ? [`products:${productId}`] : []),
      ...(ownerId && productId ? [`my-products:${ownerId}:${productId}`] : []),
      ...(ownerId && storeId ? [`my-store:${ownerId}:${storeId}`] : []),
    ];

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
