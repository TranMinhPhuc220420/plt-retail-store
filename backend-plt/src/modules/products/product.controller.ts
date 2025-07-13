import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { AuthMiddleware } from '@/modules/auth/auth.service';

@Controller('product')
export class ProductController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllProducts() {
    return [
      {
        id: '1',
        name: 'Product 1',
        price: 100,
        description: 'Description for Product 1',
      },
      {
        id: '2',
        name: 'Product 2',
        price: 200,
        description: 'Description for Product 2',
      }
    ];
  }
}
