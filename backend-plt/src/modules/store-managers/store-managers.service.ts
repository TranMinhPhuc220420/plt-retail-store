import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entity imports
import { StoreManager as StoreManagerEntity } from '@/entities/StoreManager';

// Interface imports
import { StoreManager, User } from '@/interfaces';

@Injectable()
export class StoreManagersService {
  constructor(
    @InjectRepository(StoreManagerEntity)
    private readonly storeManagerRepository: Repository<StoreManagerEntity>,
  ) {}

  /**
   * Helper method to map StoreManagerEntity to StoreManager interface
   */
  private mapEntityToStoreManager(entity: StoreManagerEntity): StoreManager {
    return {
      id: entity.id,
      userId: entity.userId,
      storeId: entity.storeId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      user: {
        id: entity.user.id,
        email: entity.user.email,
        username: entity.user.username,
        fullname: entity.user.fullname,
        avatar: entity.user.avatar,
        role: entity.user.role,
        isActive: entity.user.isActive,
        createdAt: entity.user.createdAt,
        updatedAt: entity.user.updatedAt,
      },
      store: {
        id: entity.store.id,
        name: entity.store.name,
        storeCode: entity.store.storeCode,
        address: entity.store.address,
        phone: entity.store.phone,
        email: entity.store.email,
        description: entity.store.description,
        imageUrl: entity.store.imageUrl,
        ownerId: entity.store.ownerId,
        createdAt: entity.store.createdAt,
        updatedAt: entity.store.updatedAt,
      },
    };
  }

  async getAllStoreManagers(): Promise<StoreManager[]> {
    const storeManagerEntities = await this.storeManagerRepository.find({
      relations: ['user', 'store'],
    });
    return storeManagerEntities.map(entity => this.mapEntityToStoreManager(entity));
  }

  async getStoreManagerById(id: string): Promise<StoreManager | null> {
    const storeManagerEntity = await this.storeManagerRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });
    return storeManagerEntity ? this.mapEntityToStoreManager(storeManagerEntity) : null;
  }

  async createStoreManager(data: StoreManager): Promise<StoreManager> {
    const storeManagerEntity = this.storeManagerRepository.create({
      userId: data.userId,
      storeId: data.storeId,
    });

    const savedEntity = await this.storeManagerRepository.save(storeManagerEntity);
    const savedStoreManager = await this.storeManagerRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['user', 'store'],
    });

    return this.mapEntityToStoreManager(savedStoreManager!);
  }

  async updateStoreManager(id: string, data: Partial<StoreManager>): Promise<StoreManager> {
    // Only update primitive fields, not nested objects
    const updateData: Partial<StoreManagerEntity> = {};
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.storeId !== undefined) updateData.storeId = data.storeId;

    await this.storeManagerRepository.update({ id }, updateData);
    const updatedEntity = await this.storeManagerRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!updatedEntity) {
      throw new Error('StoreManager not found after update');
    }

    return this.mapEntityToStoreManager(updatedEntity);
  }

  async deleteStoreManager(id: string): Promise<StoreManager> {
    const storeManagerEntity = await this.storeManagerRepository.findOne({ where: { id } });
    
    if (!storeManagerEntity) {
      throw new Error('StoreManager not found');
    }

    const storeManager = this.mapEntityToStoreManager(storeManagerEntity);
    await this.storeManagerRepository.delete({ id });
    return storeManager;
  }

  async getMyStoreManagers(user: User): Promise<StoreManager[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const storeManagerEntities = await this.storeManagerRepository.find({
      where: { userId: user.id },
      relations: ['store'],
    });

    return storeManagerEntities.map(entity => this.mapEntityToStoreManager(entity));
  }

  async getMyStoreManagerById(user: User, storeManagerId: string): Promise<StoreManager | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const storeManagerEntity = await this.storeManagerRepository.findOne({
      where: { id: storeManagerId, userId: user.id },
      relations: ['store'],
    });

    return storeManagerEntity ? this.mapEntityToStoreManager(storeManagerEntity) : null;
  }

  async getStoreManagersByStore(storeId: string): Promise<StoreManager[]> {
    const storeManagerEntities = await this.storeManagerRepository.find({
      where: { storeId },
      relations: ['user'],
    });

    return storeManagerEntities.map(entity => this.mapEntityToStoreManager(entity));
  }

  async getMyStoreManagersByStore(user: User, storeId: string): Promise<StoreManager[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const storeManagerEntities = await this.storeManagerRepository.find({
      where: { storeId, userId: user.id },
      relations: ['store'],
    });

    return storeManagerEntities.map(entity => this.mapEntityToStoreManager(entity));
  }
}
