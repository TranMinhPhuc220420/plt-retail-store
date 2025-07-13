import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '@/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;

  const mockPrisma = {
    customer: {
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
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllCustomers', () => {
    it('should return all customers with relations', async () => {
      const customers = [{ id: '1', userId: 'u1', storeId: 's1' }];
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
      
      expect(await service.getAllCustomers()).toEqual(customers);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          store: true,
        },
      });
    });
  });

  describe('getMyCustomers', () => {
    it('should throw if user is not authenticated', async () => {
      await expect(service.getMyCustomers(null as any)).rejects.toThrow(UnauthorizedException);
      await expect(service.getMyCustomers({} as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should return customers for user', async () => {
      const user = { id: 'u1' };
      const customers = [{ id: '1', userId: 'u1', storeId: 's1' }];
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(customers);
      
      expect(await service.getMyCustomers(user as any)).toEqual(customers);
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: {
          store: true,
        },
      });
    });
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const data = { userId: 'u1', storeId: 's1' };
      const created = { id: '1', ...data };
      (prisma.customer.create as jest.Mock).mockResolvedValue(created);
      
      expect(await service.createCustomer(data as any)).toEqual(created);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining(data),
        include: {
          user: true,
          store: true,
        },
      });
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      const id = '1';
      const deleted = { id };
      (prisma.customer.delete as jest.Mock).mockResolvedValue(deleted);
      
      expect(await service.deleteCustomer(id)).toEqual(deleted);
      expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { id } });
    });
  });
});
