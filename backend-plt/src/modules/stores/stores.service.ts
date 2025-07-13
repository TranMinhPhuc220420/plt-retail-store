import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

import { Store, User } from '@/interfaces'; // Assuming you have a User interface defined

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Example method to get all stores
  async getAllStores() {
    return this.prisma.store.findMany();
  }

  // Example method to get a store by ID
  async getStoreById(id: string) {
    return this.prisma.store.findUnique({ where: { id } });
  }

  // Additional methods for creating, updating, and deleting stores can be added here
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
}
