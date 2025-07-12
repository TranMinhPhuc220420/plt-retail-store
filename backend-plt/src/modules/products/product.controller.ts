import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Controller('products')
export class ProductController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
    });
  }

  @Get('categories')
  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
    });
  }
}
