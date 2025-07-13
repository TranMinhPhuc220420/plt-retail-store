import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { Employee, User } from '@/interfaces';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAllEmployees() {
    return this.prisma.employee.findMany({
      include: {
        user: true,
        store: true,
        shifts: true,
      },
    });
  }

  async getEmployeeById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        store: true,
        shifts: true,
      },
    });
  }

  async createEmployee(data: Employee) {
    return this.prisma.employee.create({
      data: {
        userId: data.userId,
        storeId: data.storeId,
        position: data.position,
      },
      include: {
        user: true,
        store: true,
      },
    });
  }

  async updateEmployee(id: string, data: Partial<Employee>) {
    return this.prisma.employee.update({
      where: { id },
      data,
      include: {
        user: true,
        store: true,
      },
    });
  }

  async deleteEmployee(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }

  async getMyEmployees(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.employee.findMany({
      where: { userId: user.id },
      include: {
        store: true,
        shifts: true,
      },
    });
  }

  async getMyEmployeeById(user: User, employeeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        userId: user.id,
      },
      include: {
        store: true,
        shifts: true,
      },
    });
  }

  async getEmployeesByStore(storeId: string) {
    return this.prisma.employee.findMany({
      where: { storeId },
      include: {
        user: true,
        shifts: true,
      },
    });
  }

  async getMyEmployeesByStore(user: User, storeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.employee.findMany({
      where: {
        storeId,
        userId: user.id,
      },
      include: {
        store: true,
        shifts: true,
      },
    });
  }
}
