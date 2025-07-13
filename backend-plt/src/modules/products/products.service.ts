import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { Product, User } from '@/interfaces';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        store: true,
        owner: true,
        categories: true,
      },
    });
  }

  async getProductById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        store: true,
        owner: true,
        categories: true,
        images: true,
      },
    });
  }

  async createProduct(data: Product) {
    return this.prisma.product.create({
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
  }

  async updateProduct(id: string, data: Partial<any>) {
    // Exclude ownerId from update data
    const { ownerId, ...updateData } = data;
    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        owner: true,
        categories: true,
      },
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async getMyProducts(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.product.findMany({
      where: { ownerId: user.id },
      include: {
        store: true,
        categories: true,
      },
    });
  }

  async getMyProductById(user: User, productId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.product.findFirst({
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
  }

  async getProductsByStore(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId },
      include: {
        categories: true,
        images: true,
      },
    });
  }

  async getMyProductsByStore(user: User, storeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.product.findMany({
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
  }
}
