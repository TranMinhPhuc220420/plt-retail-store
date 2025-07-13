import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ProductType, User } from '@/interfaces';

@Injectable()
export class ProductTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProductTypes() {
    return this.prisma.productType.findMany();
  }

  async getProductTypeById(id: string) {
    return this.prisma.productType.findUnique({ where: { id } });
  }

  async createProductType(data: ProductType) {
    return this.prisma.productType.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
      },
    });
  }

  async updateProductType(id: string, data: Partial<any>) {
    const { ownerId, ...updateData } = data;
    return this.prisma.productType.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteProductType(id: string) {
    return this.prisma.productType.delete({ where: { id } });
  }

  async getMyProductTypes(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }
    return this.prisma.productType.findMany({ where: { ownerId: user.id } });
  }

  async getMyProductTypeById(user: User, productTypeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }
    return this.prisma.productType.findFirst({
      where: {
        id: productTypeId,
        ownerId: user.id,
      },
    });
  }
}
