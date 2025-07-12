import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';
import { DatabaseModule } from '@/database/database.module';
import { ProductModule } from '@/modules/products/product.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [DatabaseModule, ProductModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
