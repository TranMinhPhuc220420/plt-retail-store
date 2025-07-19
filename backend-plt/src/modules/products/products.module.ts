import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthMiddleware } from '@/modules/auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// Entities
import { Product } from '@/entities/Product';
import { ProductType } from '@/entities/ProductType';
import { Store } from '@/entities/Store';
// Controllers
import { ProductsController } from './products.controller';
// Services
import { ProductsService } from './products.service';
import { UploadService, ProductFileInterceptor } from '../upload/upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductType, Store]), CacheModule.register()],
  controllers: [ProductsController],
  providers: [ProductsService, UploadService, ProductFileInterceptor],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ProductsController);
  }
}
