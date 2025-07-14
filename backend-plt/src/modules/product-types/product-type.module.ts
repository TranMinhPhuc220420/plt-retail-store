import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
// Controllers
import { ProductTypeController } from './product-type.controller';
// Services
import { CacheService } from '@/modules/cache/cache.service';
import { ProductTypeService } from './product-type.service';
import { PrismaService } from '@/database/prisma.service';
import { AuthMiddleware } from '@/modules/auth/auth.service';

@Module({
  controllers: [ProductTypeController],
  providers: [CacheService, ProductTypeService, PrismaService],
  exports: [ProductTypeService],
})
export class ProductTypeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ProductTypeController);
  }
}
