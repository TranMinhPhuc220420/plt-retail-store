import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthMiddleware } from '@/modules/auth/auth.service';

// Controllers
import { ProductsController } from './products.controller';
// Services
import { ProductsService } from './products.service';
import { UploadService, StoreFileInterceptor } from '../upload/upload.service';
import { PrismaService } from '@/database/prisma.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [ProductsController],
  providers: [ProductsService, UploadService, StoreFileInterceptor, PrismaService],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ProductsController);
  }
}
