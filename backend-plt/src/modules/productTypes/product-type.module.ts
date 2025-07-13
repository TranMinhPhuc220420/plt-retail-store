import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductTypeController } from './product-type.controller';
import { ProductTypeService } from './product-type.service';
import { PrismaService } from '@/database/prisma.service';
import { AuthMiddleware } from '@/modules/auth/auth.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [ProductTypeController],
  providers: [ProductTypeService, PrismaService],
  exports: [ProductTypeService],
})
export class ProductTypeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ProductTypeController);
  }
}
