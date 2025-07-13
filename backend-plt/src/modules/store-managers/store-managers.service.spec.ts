import { Test, TestingModule } from '@nestjs/testing';
import { StoreManagersService } from './store-managers.service';
import { PrismaService } from '@/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('StoreManagersService', () => {
  let service: StoreManagersService;
  let prisma: PrismaService;

  const mockPrisma = {
    storeManager: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreManagersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StoreManagersService>(StoreManagersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllStoreManagers', () => {
    it('should return all store managers with relations', async () => {
      const storeManagers = [{ id: '1', userId: 'u1', storeId: 's1' }];
      (prisma.storeManager.findMany as jest.Mock).mockResolvedValue(storeManagers);
      
      expect(await service.getAllStoreManagers()).toEqual(storeManagers);
      expect(prisma.storeManager.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          store: true,
        },
      });
    });
  });

  describe('getMyStoreManagers', () => {
    it('should throw if user is not authenticated', async () => {
      await expect(service.getMyStoreManagers(null as any)).rejects.toThrow(UnauthorizedException);
      await expect(service.getMyStoreManagers({} as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should return store managers for user', async () => {
      const user = { id: 'u1' };
      const storeManagers = [{ id: '1', userId: 'u1', storeId: 's1' }];
      (prisma.storeManager.findMany as jest.Mock).mockResolvedValue(storeManagers);
      
      expect(await service.getMyStoreManagers(user as any)).toEqual(storeManagers);
      expect(prisma.storeManager.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: {
          store: true,
        },
      });
    });
  });

  describe('createStoreManager', () => {
    it('should create a store manager', async () => {
      const data = { userId: 'u1', storeId: 's1' };
      const created = { id: '1', ...data };
      (prisma.storeManager.create as jest.Mock).mockResolvedValue(created);
      
      expect(await service.createStoreManager(data as any)).toEqual(created);
      expect(prisma.storeManager.create).toHaveBeenCalledWith({
        data: expect.objectContaining(data),
        include: {
          user: true,
          store: true,
        },
      });
    });
  });

  describe('deleteStoreManager', () => {
    it('should delete a store manager', async () => {
      const id = '1';
      const deleted = { id };
      (prisma.storeManager.delete as jest.Mock).mockResolvedValue(deleted);
      
      expect(await service.deleteStoreManager(id)).toEqual(deleted);
      expect(prisma.storeManager.delete).toHaveBeenCalledWith({ where: { id } });
    });
  });
});
