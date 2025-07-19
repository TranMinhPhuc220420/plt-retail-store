import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Controllers
import { ProductTypeController } from './product-type.controller';
// Services
import { CacheService } from '@/modules/cache/cache.service';
import { ProductTypeService } from './product-type.service';
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Entities
import { ProductType } from '@/entities/ProductType';
import { Store } from '@/entities/Store';

@Module({
  imports: [TypeOrmModule.forFeature([ProductType, Store])],
  controllers: [ProductTypeController],
  providers: [CacheService, ProductTypeService],
  exports: [ProductTypeService],
})
export class ProductTypeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ProductTypeController);
  }
}
