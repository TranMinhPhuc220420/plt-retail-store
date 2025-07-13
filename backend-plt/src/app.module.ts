import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';

import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductModule } from '@/modules/products/product.module';
import { StoresService } from './modules/stores/stores.service';

@Module({
  imports: [DatabaseModule, AuthModule, StoresModule, ProductModule],
  controllers: [AppController],
  providers: [AppService, StoresService],
})
export class AppModule {}
