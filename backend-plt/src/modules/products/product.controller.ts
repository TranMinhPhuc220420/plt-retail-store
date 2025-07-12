import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Controller('products')
export class ProductController {
  constructor(private readonly prisma: PrismaService) {}
}
