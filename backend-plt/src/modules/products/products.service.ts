import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@/database/prisma.service';

import { Product, User } from '@/interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
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

  async getMyProducts(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: { ownerId: user.id },
      include: {
        store: true,
        categories: true,
      },
    });

    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async getMyProductById(user: User, productId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}:${productId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
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
    });

    if (product) {
      await this.cacheManager.set(cacheKey, product, 300000); // 5 minutes
    }
    return product;
  }

  async getProductsByStore(storeId: string) {
    const cacheKey = `products:store:${storeId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: { storeId },
      include: {
        categories: true,
        images: true,
      },
    });

    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  async getMyProductsByStore(user: User, storeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const cacheKey = `my-products:${user.id}:store:${storeId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
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
    });

    await this.cacheManager.set(cacheKey, products, 300000); // 5 minutes
    return products;
  }

  private async invalidateProductCaches(ownerId?: string, storeId?: string, productId?: string) {
    const keys = [
      'products:all',
      ...(ownerId ? [`my-products:${ownerId}`] : []),
      ...(storeId ? [`products:store:${storeId}`] : []),
      ...(ownerId && storeId ? [`my-products:${ownerId}:store:${storeId}`] : []),
      ...(productId ? [`products:${productId}`] : []),
      ...(ownerId && productId ? [`my-products:${ownerId}:${productId}`] : []),
    ];

    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
