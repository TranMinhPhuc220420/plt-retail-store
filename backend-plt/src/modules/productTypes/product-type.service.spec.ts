import { Test, TestingModule } from '@nestjs/testing';
import { ProductTypeService } from './product-type.service';
import { PrismaService } from '@/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('ProductTypeService', () => {
  let service: ProductTypeService;
  let prisma: any;

  const mockPrisma = {
    productType: {
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
        ProductTypeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductTypeService>(ProductTypeService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProductTypes', () => {
    it('should return all product types', async () => {
      const result = [{ id: '1', name: 'A' }];
      prisma.productType.findMany.mockResolvedValue(result);
      expect(await service.getAllProductTypes()).toEqual(result);
      expect(prisma.productType.findMany).toHaveBeenCalled();
    });
  });

  describe('getProductTypeById', () => {
    it('should return product type by id', async () => {
      const result = { id: '1', name: 'A' };
      prisma.productType.findUnique.mockResolvedValue(result);
      expect(await service.getProductTypeById('1')).toEqual(result);
      expect(prisma.productType.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('createProductType', () => {
    it('should create a product type', async () => {
      const data = { name: 'A', description: 'desc', ownerId: 'user1' };
      const result = { ...data, id: '1' };
      prisma.productType.create.mockResolvedValue(result);
      expect(await service.createProductType(data as any)).toEqual(result);
      expect(prisma.productType.create).toHaveBeenCalledWith({
        data: {
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
        },
      });
    });
  });

  describe('updateProductType', () => {
    it('should update a product type', async () => {
      const id = '1';
      const data = { name: 'B', ownerId: 'user1' };
      const result = { id, ...data };
      prisma.productType.update.mockResolvedValue(result);
      expect(await service.updateProductType(id, data)).toEqual(result);
      expect(prisma.productType.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: 'B' },
      });
    });
  });

  describe('deleteProductType', () => {
    it('should delete a product type', async () => {
      const id = '1';
      const result = { id };
      prisma.productType.delete.mockResolvedValue(result);
      expect(await service.deleteProductType(id)).toEqual(result);
      expect(prisma.productType.delete).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('getMyProductTypes', () => {
    it('should throw UnauthorizedException if user is null', async () => {
      await expect(service.getMyProductTypes(null as any)).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException if user has no id', async () => {
      await expect(service.getMyProductTypes({} as any)).rejects.toThrow(UnauthorizedException);
    });
    it('should return product types for user', async () => {
      const user = { id: 'user1' };
      const result = [{ id: '1', ownerId: 'user1' }];
      prisma.productType.findMany.mockResolvedValue(result);
      expect(await service.getMyProductTypes(user as any)).toEqual(result);
      expect(prisma.productType.findMany).toHaveBeenCalledWith({ where: { ownerId: user.id } });
    });
  });

  describe('getMyProductTypeById', () => {
    it('should throw UnauthorizedException if user is null', async () => {
      await expect(service.getMyProductTypeById(null as any, '1')).rejects.toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException if user has no id', async () => {
      await expect(service.getMyProductTypeById({} as any, '1')).rejects.toThrow(UnauthorizedException);
    });
    it('should return product type for user and id', async () => {
      const user = { id: 'user1' };
      const result = { id: '1', ownerId: 'user1' };
      prisma.productType.findFirst.mockResolvedValue(result);
      expect(await service.getMyProductTypeById(user as any, '1')).toEqual(result);
      expect(prisma.productType.findFirst).toHaveBeenCalledWith({
        where: { id: '1', ownerId: user.id },
      });
    });
  });
});
