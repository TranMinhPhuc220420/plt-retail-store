import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';

import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from './modules/stores/stores.module';
import { StoresService } from '@/modules/stores/stores.service';
import { ProductTypeModule } from '@/modules/productTypes/product-type.module';
import { ProductsModule } from '@/modules/products/products.module';

@Module({
  imports: [DatabaseModule, AuthModule, StoresModule, ProductTypeModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService, StoresService],
})
export class AppModule {}
