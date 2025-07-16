import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@/database/prisma.service';

import { Product, ProductType, Store, User } from '@/interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////

  async getAllProducts() {
    const cacheKey = 'products:all';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      include: {
        store: true,
        owner: true,
        categories: true,
        images: true,
      },
    });

    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async getProductById(id: string) {
    const cacheKey = `products:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        owner: true,
        categories: true,
        images: true,
      },
    });

    if (product) {
      await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes
    }
    return product;
  }

  async createProduct(data: Product) {
    const product = await this.prisma.product.create({
      data: {
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

        categories: {
          connect: data.categories?.map(category => ({ id: category.id })),
        },
        ownerId: data.ownerId,
        storeId: data.storeId,
      },
      include: {
        store: true,
        owner: true,
        categories: true,
      },
    });

    // Invalidate related caches
    await this.invalidateProductCaches(data.ownerId, data.storeId);

    return product;
  }

  async updateProduct(id: string, data: Partial<any>) {
    // Exclude ownerId from update data
    const { ownerId, ...updateData } = data;

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        owner: true,
        categories: true,
      },
    });

    // Invalidate related caches
    await this.invalidateProductCaches(product.ownerId, product.storeId, id);

    return product;
  }

  async deleteProduct(id: string) {
    // Get product details before deletion for cache invalidation
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { ownerId: true, storeId: true },
    });

    const result = await this.prisma.product.delete({ where: { id } });

    // Invalidate related caches
    if (product) {
      await this.invalidateProductCaches(product.ownerId, product.storeId, id);
    }

    return result;
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

    const store = await this.prisma.store.findUnique({ 
      where: { id: storeId },
      include: {
        owner: true,
      }
    }) as Store | null;
    
    if (store) {
      await this.cacheManager.set(cacheKey, store, 300000); // 5 minutes
    }
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

    const store = await this.prisma.store.findUnique({ where: { storeCode: storeCode } }) as Store | null;
    if (store) {
      await this.cacheManager.set(cacheKey, store, 300000); // 5 minutes
    }
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

    const productType = await this.prisma.productType.findUnique({
      where: { id: categoryId, storeId },
      include: {
        store: true,
        owner: true,
        products: true,
      },
    }) as ProductType | null;

    if (productType) {
      await this.cacheManager.set(cacheKey, productType, 300000); // 5 minutes
    }

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

    const products = await this.prisma.product.findMany({
      where: { ownerId: user.id, storeId: storeId },
      include: {
        store: true,
        categories: true,
        images: true,
      },
      orderBy: { updatedAt: 'desc' },
    }) as Product[];

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

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: user.id,
      },
      include: {
        store: true,
        categories: true,
        images: true,
      },
    }) as Product | null;

    if (product) {
      await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes
    }
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

    const product = await this.prisma.product.findFirst({
      where: {
        productCode: productCode,
        ownerId: user.id,
      },
      include: {
        store: true,
        categories: true,
        images: true,
      },
    }) as Product | null;
    
    if (product) {
      await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes
    }

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

    const products = await this.prisma.product.findMany({
      where: { storeId },
      include: {
        categories: true,
        images: true,
      },
      orderBy: { updatedAt: 'desc' },
    }) as Product[];

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

    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        ownerId: user.id,
      },
      include: {
        store: true,
        categories: true,
        images: true,
      },
      orderBy: { updatedAt: 'desc' },
    }) as Product[];

    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async createProductsBulk(store: Store, user: User, data: Product[]): Promise<Product[]> {
    const products = await this.prisma.product.createMany({
      data: data.map(product => ({
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
      })),
      skipDuplicates: true,
    });

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
      ...(ownerId && storeId ? [`my-store:${ownerId}:${storeId}`] : []), // Include store cache key
    ];

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
