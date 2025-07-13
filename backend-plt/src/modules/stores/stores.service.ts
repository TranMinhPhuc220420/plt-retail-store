import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { Store, User } from '@/interfaces'; // Assuming you have a User interface defined

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getAllStores() {
    return this.prisma.store.findMany();
  }

  async getStoreById(id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  async getMyStores(user: User) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    } 

    return this.prisma.store.findMany({ where: { ownerId: user.id } });
  }

  async getMyStoreById(user: User, storeId: string) {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    return this.prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: user.id,
      },
    });
  }

  async createStore(data: Store) {
    return this.prisma.store.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
        imageUrl: data.imageUrl,
        ownerId: data.ownerId,
      },
    });
  }

  async updateStore(id: string, data: Partial<any>) {
    // Exclude ownerId from update data
    const { ownerId, ...updateData } = data;
    return this.prisma.store.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteStore(id: string) {
    return this.prisma.store.delete({ where: { id } });
  }
}
