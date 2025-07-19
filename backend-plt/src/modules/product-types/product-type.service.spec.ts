import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductTypeService } from './product-type.service';
import { ProductType } from '@/entities/ProductType';
import { Store } from '@/entities/Store';
import { UnauthorizedException } from '@nestjs/common';

describe('ProductTypeService', () => {
  let service: ProductTypeService;
  let productTypeRepository: any;
  let storeRepository: any;
  let cacheManager: any;

  const mockProductTypeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockStoreRepository = {
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTypeService,
        {
          provide: getRepositoryToken(ProductType),
          useValue: mockProductTypeRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ProductTypeService>(ProductTypeService);
    productTypeRepository = module.get(getRepositoryToken(ProductType));
    storeRepository = module.get(getRepositoryToken(Store));
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProductTypes', () => {
    it('should return all product types', async () => {
      const entities = [{ id: '1', name: 'A', storeId: 'store1', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() }];
      cacheManager.get.mockResolvedValue(null);
      productTypeRepository.find.mockResolvedValue(entities);
      
      const result = await service.getAllProductTypes();
      
      expect(result).toEqual(entities.map(entity => expect.objectContaining({
        id: entity.id,
        name: entity.name,
        storeId: entity.storeId,
        ownerId: entity.ownerId,
      })));
      expect(productTypeRepository.find).toHaveBeenCalled();
    });
  });

  describe('getProductTypeById', () => {
    it('should return product type by id', async () => {
      const entity = { id: '1', name: 'A', storeId: 'store1', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() };
      cacheManager.get.mockResolvedValue(null);
      productTypeRepository.findOne.mockResolvedValue(entity);
      
      const result = await service.getProductTypeById('1');
      
      expect(result).toEqual(expect.objectContaining({
        id: entity.id,
        name: entity.name,
        storeId: entity.storeId,
        ownerId: entity.ownerId,
      }));
      expect(productTypeRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('createProductType', () => {
    it('should create a product type', async () => {
      const data = { name: 'A', description: 'desc', storeId: 'store1', ownerId: 'user1' };
      const entity = { ...data, id: '1', createdAt: new Date(), updatedAt: new Date() };
      
      productTypeRepository.create.mockReturnValue(entity);
      productTypeRepository.save.mockResolvedValue(entity);
      
      const result = await service.createProductType(data as any);
      
      expect(result).toEqual(expect.objectContaining({
        id: '1',
        name: data.name,
        description: data.description,
        storeId: data.storeId,
        ownerId: data.ownerId,
      }));
      expect(productTypeRepository.create).toHaveBeenCalledWith({
        name: data.name,
        description: data.description,
        storeId: data.storeId,
        ownerId: data.ownerId,
      });
    });
  });

  describe('updateProductType', () => {
    it('should update a product type', async () => {
      const id = '1';
      const data = { name: 'B', ownerId: 'user1' };
      const entity = { id, name: 'B', storeId: 'store1', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() };
      
      productTypeRepository.update.mockResolvedValue(undefined);
      productTypeRepository.findOne.mockResolvedValue(entity);
      
      const result = await service.updateProductType(id, data);
      
      expect(result).toEqual(expect.objectContaining({
        id,
        name: 'B',
        storeId: 'store1',
        ownerId: 'user1',
      }));
      expect(productTypeRepository.update).toHaveBeenCalledWith({ id }, { name: 'B' });
    });
  });

  describe('deleteProductType', () => {
    it('should delete a product type', async () => {
      const id = '1';
      const entity = { id, name: 'A', storeId: 'store1', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() };
      
      productTypeRepository.findOne.mockResolvedValue(entity);
      productTypeRepository.delete.mockResolvedValue(undefined);
      
      const result = await service.deleteProductType(id);
      
      expect(result).toEqual(expect.objectContaining({
        id,
        name: 'A',
        storeId: 'store1',
        ownerId: 'user1',
      }));
      expect(productTypeRepository.delete).toHaveBeenCalledWith({ id });
    });
  });

  describe('getMyProductTypes', () => {
    it('should throw UnauthorizedException if user is null', async () => {
      await expect(service.getMyProductTypes(null as any, 'store1')).rejects.toThrow(UnauthorizedException);
    });
    
    it('should throw UnauthorizedException if user has no id', async () => {
      await expect(service.getMyProductTypes({} as any, 'store1')).rejects.toThrow(UnauthorizedException);
    });
    
    it('should return product types for user and store', async () => {
      const user = { id: 'user1' };
      const storeId = 'store1';
      const entities = [{ id: '1', name: 'A', storeId, ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() }];
      
      cacheManager.get.mockResolvedValue(null);
      productTypeRepository.find.mockResolvedValue(entities);
      
      const result = await service.getMyProductTypes(user as any, storeId);
      
      expect(result).toEqual(entities.map(entity => expect.objectContaining({
        id: entity.id,
        name: entity.name,
        storeId: entity.storeId,
        ownerId: entity.ownerId,
      })));
      expect(productTypeRepository.find).toHaveBeenCalledWith({
        where: { ownerId: user.id, storeId },
        order: { updatedAt: 'DESC' },
      });
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
      const entity = { id: '1', name: 'A', storeId: 'store1', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() };
      
      cacheManager.get.mockResolvedValue(null);
      productTypeRepository.findOne.mockResolvedValue(entity);
      
      const result = await service.getMyProductTypeById(user as any, '1');
      
      expect(result).toEqual(expect.objectContaining({
        id: entity.id,
        name: entity.name,
        storeId: entity.storeId,
        ownerId: entity.ownerId,
      }));
      expect(productTypeRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', ownerId: user.id },
      });
    });
  });
});
