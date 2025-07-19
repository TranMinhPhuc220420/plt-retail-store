import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entity imports
import { Employee as EmployeeEntity } from '@/entities/Employee';

// Interface imports
import { Employee, User } from '@/interfaces';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  /**
   * Helper method to map EmployeeEntity to Employee interface
   */
  private mapEntityToEmployee(entity: EmployeeEntity): Employee {
    return {
      id: entity.id,
      userId: entity.userId,
      storeId: entity.storeId,
      position: entity.position,
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

  async getAllEmployees(): Promise<Employee[]> {
    const employeeEntities = await this.employeeRepository.find({
      relations: ['user', 'store', 'shifts'],
    });
    return employeeEntities.map(entity => this.mapEntityToEmployee(entity));
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    const employeeEntity = await this.employeeRepository.findOne({
      where: { id },
      relations: ['user', 'store', 'shifts'],
    });
    return employeeEntity ? this.mapEntityToEmployee(employeeEntity) : null;
  }

  async createEmployee(data: Employee): Promise<Employee> {
    const employeeEntity = this.employeeRepository.create({
      userId: data.userId,
      storeId: data.storeId,
      position: data.position,
    });

    const savedEntity = await this.employeeRepository.save(employeeEntity);
    const savedEmployee = await this.employeeRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['user', 'store'],
    });

    return this.mapEntityToEmployee(savedEmployee!);
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    // Only pick primitive fields for update
    const updateData: Partial<EmployeeEntity> = {
      userId: data.userId,
      storeId: data.storeId,
      position: data.position,
    };
    await this.employeeRepository.update({ id }, updateData);
    const updatedEntity = await this.employeeRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!updatedEntity) {
      throw new Error('Employee not found after update');
    }

    return this.mapEntityToEmployee(updatedEntity);
  }

  async deleteEmployee(id: string): Promise<Employee> {
    const employeeEntity = await this.employeeRepository.findOne({ where: { id } });
    
    if (!employeeEntity) {
      throw new Error('Employee not found');
    }

    const employee = this.mapEntityToEmployee(employeeEntity);
    await this.employeeRepository.delete({ id });
    return employee;
  }

  async getMyEmployees(user: User): Promise<Employee[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const employeeEntities = await this.employeeRepository.find({
      where: { userId: user.id },
      relations: ['store', 'shifts'],
    });

    return employeeEntities.map(entity => this.mapEntityToEmployee(entity));
  }

  async getMyEmployeeById(user: User, employeeId: string): Promise<Employee | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const employeeEntity = await this.employeeRepository.findOne({
      where: { id: employeeId, userId: user.id },
      relations: ['store', 'shifts'],
    });

    return employeeEntity ? this.mapEntityToEmployee(employeeEntity) : null;
  }

  async getEmployeesByStore(storeId: string): Promise<Employee[]> {
    const employeeEntities = await this.employeeRepository.find({
      where: { storeId },
      relations: ['user', 'shifts'],
    });

    return employeeEntities.map(entity => this.mapEntityToEmployee(entity));
  }

  async getMyEmployeesByStore(user: User, storeId: string): Promise<Employee[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const employeeEntities = await this.employeeRepository.find({
      where: { storeId, userId: user.id },
      relations: ['store', 'shifts'],
    });

    return employeeEntities.map(entity => this.mapEntityToEmployee(entity));
  }
}
