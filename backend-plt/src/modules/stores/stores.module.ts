import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '@/modules/auth/auth.service';

import { DatabaseModule } from '@/database/database.module';
// Entities
import { Store } from '@/entities/Store';
import { TypeOrmModule } from '@nestjs/typeorm';
// Controllers
import { StoresController } from './stores.controller';
// Services
import { CacheService } from '@/modules/cache/cache.service';
import { StoresService } from './stores.service';
import { UploadService, StoreFileInterceptor } from '../upload/upload.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Store])],
  controllers: [StoresController],
  providers: [CacheService, StoresService, UploadService, StoreFileInterceptor],
  exports: [StoresService],
})
export class StoresModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(StoresController);
  }
}
