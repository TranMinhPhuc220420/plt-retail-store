import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '@/modules/auth/auth.service';

// Controllers
import { StoresController } from './stores.controller';
// Services
import { CacheService } from '@/modules/cache/cache.service';
import { StoresService } from './stores.service';
import { UploadService, StoreFileInterceptor } from '../upload/upload.service';
import { PrismaService } from '@/database/prisma.service';

@Module({
  controllers: [StoresController],
  providers: [CacheService, StoresService, UploadService, StoreFileInterceptor, PrismaService],
  exports: [StoresService],
})
export class StoresModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(StoresController);
  }
}
