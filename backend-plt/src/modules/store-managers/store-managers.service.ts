import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { StoreManager, User } from '@/interfaces';

@Injectable()
export class StoreManagersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAllStoreManagers() {
    return this.prisma.storeManager.findMany({
      include: {
        user: true,
        store: true,
      },
    });
  }

  async getStoreManagerById(id: string) {
    return this.prisma.storeManager.findUnique({
      where: { id },
      include: {
        user: true,
        store: true,
      },
    });
  }

  async createStoreManager(data: StoreManager) {
    return this.prisma.storeManager.create({
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

  async updateStoreManager(id: string, data: Partial<any>) {
    return this.prisma.storeManager.update({
      where: { id },
      data,
      include: {
        user: true,
        store: true,
      },
    });
  }

  async deleteStoreManager(id: string) {
    return this.prisma.storeManager.delete({ where: { id } });
  }

  async getMyStoreManagers(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.storeManager.findMany({
      where: { userId: user.id },
      include: {
        store: true,
      },
    });
  }

  async getMyStoreManagerById(user: User, storeManagerId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.storeManager.findFirst({
      where: {
        id: storeManagerId,
        userId: user.id,
      },
      include: {
        store: true,
      },
    });
  }

  async getStoreManagersByStore(storeId: string) {
    return this.prisma.storeManager.findMany({
      where: { storeId },
      include: {
        user: true,
      },
    });
  }

  async getMyStoreManagersByStore(user: User, storeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.storeManager.findMany({
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
