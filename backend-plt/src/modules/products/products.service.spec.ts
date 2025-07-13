import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '@/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
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
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProducts', () => {
    it('should return all products with relations', async () => {
      const products = [{ id: '1', name: 'Product A', ownerId: 'u1' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
      
      expect(await service.getAllProducts()).toEqual(products);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        include: {
          store: true,
          owner: true,
          categories: true,
        },
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product by id with relations', async () => {
      const product = { id: '1', name: 'Product A', ownerId: 'u1' };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(product);
      
      expect(await service.getProductById('1')).toEqual(product);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          store: true,
          owner: true,
          categories: true,
          images: true,
        },
      });
    });
  });

  describe('getMyProducts', () => {
    it('should throw if user is not authenticated', async () => {
      await expect(service.getMyProducts(null as any)).rejects.toThrow(UnauthorizedException);
      await expect(service.getMyProducts({} as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should return products for user', async () => {
      const user = { id: 'u1' };
      const products = [{ id: '1', ownerId: 'u1', name: 'Product A' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
      
      expect(await service.getMyProducts(user as any)).toEqual(products);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'u1' },
        include: {
          store: true,
          categories: true,
        },
      });
    });
  });

  describe('getMyProductById', () => {
    it('should throw if user is not authenticated', async () => {
      await expect(service.getMyProductById(null as any, '1')).rejects.toThrow(UnauthorizedException);
      await expect(service.getMyProductById({} as any, '1')).rejects.toThrow(UnauthorizedException);
    });

    it('should return product for user and id', async () => {
      const user = { id: 'u1' };
      const product = { id: '1', ownerId: 'u1', name: 'Product A' };
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(product);
      
      expect(await service.getMyProductById(user as any, '1')).toEqual(product);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: '1', ownerId: 'u1' },
        include: {
          store: true,
          categories: true,
          images: true,
        },
      });
    });
  });

  describe('createProduct', () => {
    it('should create a product', async () => {
      const data = { 
        name: 'Product A', 
        price: 100, 
        stock: 10, 
        ownerId: 'u1', 
        storeId: 's1' 
      };
      const created = { id: '1', ...data };
      (prisma.product.create as jest.Mock).mockResolvedValue(created);
      
      expect(await service.createProduct(data as any)).toEqual(created);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: data.name,
          price: data.price,
          stock: data.stock,
          ownerId: data.ownerId,
          storeId: data.storeId,
        }),
        include: {
          store: true,
          owner: true,
          categories: true,
        },
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product and exclude ownerId', async () => {
      const id = '1';
      const data = { name: 'Updated Product', ownerId: 'u1', price: 150 };
      const updated = { id, name: 'Updated Product', price: 150 };
      (prisma.product.update as jest.Mock).mockResolvedValue(updated);
      
      expect(await service.updateProduct(id, data as any)).toEqual(updated);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: 'Updated Product', price: 150 },
        include: {
          store: true,
          owner: true,
          categories: true,
        },
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const id = '1';
      const deleted = { id };
      (prisma.product.delete as jest.Mock).mockResolvedValue(deleted);
      
      expect(await service.deleteProduct(id)).toEqual(deleted);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('getProductsByStore', () => {
    it('should return products by store id', async () => {
      const storeId = 's1';
      const products = [{ id: '1', storeId, name: 'Product A' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
      
      expect(await service.getProductsByStore(storeId)).toEqual(products);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { storeId },
        include: {
          categories: true,
          images: true,
        },
      });
    });
  });

  describe('getMyProductsByStore', () => {
    it('should throw if user is not authenticated', async () => {
      await expect(service.getMyProductsByStore(null as any, 's1')).rejects.toThrow(UnauthorizedException);
      await expect(service.getMyProductsByStore({} as any, 's1')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user products by store id', async () => {
      const user = { id: 'u1' };
      const storeId = 's1';
      const products = [{ id: '1', storeId, ownerId: 'u1', name: 'Product A' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(products);
      
      expect(await service.getMyProductsByStore(user as any, storeId)).toEqual(products);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { storeId, ownerId: 'u1' },
        include: {
          store: true,
          categories: true,
          images: true,
        },
      });
    });
  });
});
