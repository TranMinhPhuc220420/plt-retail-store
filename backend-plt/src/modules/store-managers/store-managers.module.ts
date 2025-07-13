import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '@/modules/auth/auth.service';

// Controllers
import { StoreManagersController } from './store-managers.controller';
// Services
import { StoreManagersService } from './store-managers.service';
import { PrismaService } from '@/database/prisma.service';

@Module({
  controllers: [StoreManagersController],
  providers: [StoreManagersService, PrismaService],
  exports: [StoreManagersService],
})
export class StoreManagersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(StoreManagersController);
  }
}
