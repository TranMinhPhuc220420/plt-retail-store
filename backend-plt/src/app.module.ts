import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';
import { CacheModule } from '@nestjs/cache-manager';

import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from './modules/stores/stores.module';
import { StoresService } from '@/modules/stores/stores.service';
import { ProductTypeModule } from '@/modules/productTypes/product-type.module';
import { ProductsModule } from '@/modules/products/products.module';
// import { CacheConfigModule } from './modules/cache/cache.module';

@Module({
  imports: [
    CacheModule.register(), // Registering cache globally
    DatabaseModule,
    AuthModule,
    StoresModule,
    ProductTypeModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService, StoresService],
})
export class AppModule {}
