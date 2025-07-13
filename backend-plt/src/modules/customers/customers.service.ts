import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { Customer, User } from '@/interfaces';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAllCustomers() {
    return this.prisma.customer.findMany({
      include: {
        user: true,
        store: true,
      },
    });
  }

  async getCustomerById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        store: true,
      },
    });
  }

  async createCustomer(data: Customer) {
    return this.prisma.customer.create({
      data: {
        userId: data.userId,
        storeId: data.storeId,
      },
      include: {
        user: true,
        store: true,
      },
    });
  }

  async updateCustomer(id: string, data: Partial<Customer>) {
    return this.prisma.customer.update({
      where: { id },
      data,
      include: {
        user: true,
        store: true,
      },
    });
  }

  async deleteCustomer(id: string) {
    return this.prisma.customer.delete({ where: { id } });
  }

  async getMyCustomers(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.customer.findMany({
      where: { userId: user.id },
      include: {
        store: true,
      },
    });
  }

  async getMyCustomerById(user: User, customerId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: user.id,
      },
      include: {
        store: true,
      },
    });
  }

  async getCustomersByStore(storeId: string) {
    return this.prisma.customer.findMany({
      where: { storeId },
      include: {
        user: true,
      },
    });
  }

  async getMyCustomersByStore(user: User, storeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.customer.findMany({
      where: {
        storeId,
        userId: user.id,
      },
      include: {
        store: true,
      },
    });
  }
}
