import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthMiddleware } from '@/modules/auth/auth.service';

// Controllers
import { StoresController } from './stores.controller';
// Services
import { StoresService } from './stores.service';
import { UploadService, StoreFileInterceptor } from '../upload/upload.service';
import { PrismaService } from '@/database/prisma.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [StoresController],
  providers: [StoresService, UploadService, StoreFileInterceptor, PrismaService],
})
export class StoresModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(StoresController);
  }
}
