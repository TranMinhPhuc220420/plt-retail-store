import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from '@/modules/auth/auth.service';

// Controllers
import { EmployeesController } from './employees.controller';
// Services
import { EmployeesService } from './employees.service';
import { PrismaService } from '@/database/prisma.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, PrismaService],
  exports: [EmployeesService],
})
export class EmployeesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(EmployeesController);
  }
}
