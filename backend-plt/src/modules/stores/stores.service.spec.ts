import { Test, TestingModule } from '@nestjs/testing';
import { StoresService } from './stores.service';
import { PrismaService } from '@/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('StoresService', () => {
  let service: StoresService;
  let prisma: PrismaService;

  const mockPrisma = {
    store: {
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
        StoresService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAllStores should return all stores', async () => {
    const stores = [{ id: '1', name: 'A' }];
    (prisma.store.findMany as jest.Mock).mockResolvedValue(stores);
    expect(await service.getAllStores()).toEqual(stores);
    expect(prisma.store.findMany).toHaveBeenCalled();
  });

  it('getStoreById should return a store by id', async () => {
    const store = { id: '1', name: 'A' };
    (prisma.store.findUnique as jest.Mock).mockResolvedValue(store);
    expect(await service.getStoreById('1')).toEqual(store);
    expect(prisma.store.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('getMyStores should throw if user is not authenticated', async () => {
    await expect(service.getMyStores(null as any)).rejects.toThrow(UnauthorizedException);
    await expect(service.getMyStores({} as any)).rejects.toThrow(UnauthorizedException);
  });

  it('getMyStores should return stores for user', async () => {
    const user = { id: 'u1' };
    const stores = [{ id: '1', ownerId: 'u1' }];
    (prisma.store.findMany as jest.Mock).mockResolvedValue(stores);
    expect(await service.getMyStores(user as any)).toEqual(stores);
    expect(prisma.store.findMany).toHaveBeenCalledWith({ where: { ownerId: 'u1' } });
  });

  it('getMyStoreById should throw if user is not authenticated', async () => {
    await expect(service.getMyStoreById(null as any, '1')).rejects.toThrow(UnauthorizedException);
    await expect(service.getMyStoreById({} as any, '1')).rejects.toThrow(UnauthorizedException);
  });

  it('getMyStoreById should return store for user and id', async () => {
    const user = { id: 'u1' };
    const store = { id: '1', ownerId: 'u1' };
    (prisma.store.findFirst as jest.Mock).mockResolvedValue(store);
    expect(await service.getMyStoreById(user as any, '1')).toEqual(store);
    expect(prisma.store.findFirst).toHaveBeenCalledWith({
      where: { id: '1', ownerId: 'u1' },
    });
  });

  it('createStore should create a store', async () => {
    const data = { name: 'A', ownerId: 'u1' };
    const created = { id: '1', ...data };
    (prisma.store.create as jest.Mock).mockResolvedValue(created);
    expect(await service.createStore(data as any)).toEqual(created);
    expect(prisma.store.create).toHaveBeenCalledWith({
      data: expect.objectContaining(data),
    });
  });

  it('updateStore should update a store', async () => {
    const id = '1';
    const data = { name: 'B', ownerId: 'u1' };
    const updated = { id, ...data };
    (prisma.store.update as jest.Mock).mockResolvedValue(updated);
    expect(await service.updateStore(id, data as any)).toEqual(updated);
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id },
      data: { name: 'B' },
    });
  });

  it('deleteStore should delete a store', async () => {
    const id = '1';
    const deleted = { id };
    (prisma.store.delete as jest.Mock).mockResolvedValue(deleted);
    expect(await service.deleteStore(id)).toEqual(deleted);
    expect(prisma.store.delete).toHaveBeenCalledWith({ where: { id } });
  });
});
