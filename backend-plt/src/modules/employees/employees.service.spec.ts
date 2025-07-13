import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { PrismaService } from '@/database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: PrismaService;

  const mockPrisma = {
    employee: {
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
        EmployeesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllEmployees', () => {
    it('should return all employees with relations', async () => {
      const employees = [{ id: '1', userId: 'u1', storeId: 's1', position: 'Manager' }];
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(employees);
      
      expect(await service.getAllEmployees()).toEqual(employees);
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          store: true,
          shifts: true,
        },
      });
    });
  });

  describe('getMyEmployees', () => {
    it('should throw if user is not authenticated', async () => {
      await expect(service.getMyEmployees(null as any)).rejects.toThrow(UnauthorizedException);
      await expect(service.getMyEmployees({} as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should return employees for user', async () => {
      const user = { id: 'u1' };
      const employees = [{ id: '1', userId: 'u1', storeId: 's1', position: 'Manager' }];
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(employees);
      
      expect(await service.getMyEmployees(user as any)).toEqual(employees);
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: {
          store: true,
          shifts: true,
        },
      });
    });
  });

  describe('createEmployee', () => {
    it('should create an employee', async () => {
      const data = { userId: 'u1', storeId: 's1', position: 'Manager' };
      const created = { id: '1', ...data };
      (prisma.employee.create as jest.Mock).mockResolvedValue(created);
      
      expect(await service.createEmployee(data as any)).toEqual(created);
      expect(prisma.employee.create).toHaveBeenCalledWith({
        data: expect.objectContaining(data),
        include: {
          user: true,
          store: true,
        },
      });
    });
  });

  describe('deleteEmployee', () => {
    it('should delete an employee', async () => {
      const id = '1';
      const deleted = { id };
      (prisma.employee.delete as jest.Mock).mockResolvedValue(deleted);
      
      expect(await service.deleteEmployee(id)).toEqual(deleted);
      expect(prisma.employee.delete).toHaveBeenCalledWith({ where: { id } });
    });
  });
});
