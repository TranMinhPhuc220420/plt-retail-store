import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { AppController } from '@/modules/app/app.controller';
import { CacheModule } from '@nestjs/cache-manager';

import { AppService } from '@/modules/app/app.service';
import { CacheService } from './modules/cache/cache.service';

import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductTypeModule } from '@/modules/product-types/product-type.module';
import { ProductsModule } from '@/modules/products/products.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule.register({ isGlobal: true }), // Global cache module
    AuthModule,
    // StoresModule,
    // ProductTypeModule,
    // ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
})
export class AppModule {}
