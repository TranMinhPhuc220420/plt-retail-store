import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '@/modules/auth/auth.service';

// Controllers
import { CustomersController } from './customers.controller';
// Services
import { CustomersService } from './customers.service';
import { PrismaService } from '@/database/prisma.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, PrismaService],
  exports: [CustomersService],
})
export class CustomersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(CustomersController);
  }
}
