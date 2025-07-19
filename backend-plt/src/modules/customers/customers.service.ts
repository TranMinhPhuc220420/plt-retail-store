import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entity imports
import { Customer as CustomerEntity } from '@/entities/Customer';

// Interface imports
import { Customer, User } from '@/interfaces';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  /**
   * Helper method to map CustomerEntity to Customer interface
   */
  private mapEntityToCustomer(entity: CustomerEntity): Customer {
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

  async getAllCustomers(): Promise<Customer[]> {
    const customerEntities = await this.customerRepository.find({
      relations: ['user', 'store'],
    });
    return customerEntities.map(entity => this.mapEntityToCustomer(entity));
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const customerEntity = await this.customerRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });
    return customerEntity ? this.mapEntityToCustomer(customerEntity) : null;
  }

  async createCustomer(data: Customer): Promise<Customer> {
    const customerEntity = this.customerRepository.create({
      userId: data.userId,
      storeId: data.storeId,
    });

    const savedEntity = await this.customerRepository.save(customerEntity);
    const savedCustomer = await this.customerRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['user', 'store'],
    });

    return this.mapEntityToCustomer(savedCustomer!);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    // Only update fields that exist in CustomerEntity
    const updateData: Partial<CustomerEntity> = {};
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.storeId !== undefined) updateData.storeId = data.storeId;
    // Add other direct fields if needed

    await this.customerRepository.update({ id }, updateData);
    const updatedEntity = await this.customerRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!updatedEntity) {
      throw new Error('Customer not found after update');
    }

    return this.mapEntityToCustomer(updatedEntity);
  }

  async deleteCustomer(id: string): Promise<Customer> {
    const customerEntity = await this.customerRepository.findOne({ where: { id } });
    
    if (!customerEntity) {
      throw new Error('Customer not found');
    }

    const customer = this.mapEntityToCustomer(customerEntity);
    await this.customerRepository.delete({ id });
    return customer;
  }

  async getMyCustomers(user: User): Promise<Customer[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const customerEntities = await this.customerRepository.find({
      where: { userId: user.id },
      relations: ['store'],
    });

    return customerEntities.map(entity => this.mapEntityToCustomer(entity));
  }

  async getMyCustomerById(user: User, customerId: string): Promise<Customer | null> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const customerEntity = await this.customerRepository.findOne({
      where: { id: customerId, userId: user.id },
      relations: ['store'],
    });

    return customerEntity ? this.mapEntityToCustomer(customerEntity) : null;
  }

  async getCustomersByStore(storeId: string): Promise<Customer[]> {
    const customerEntities = await this.customerRepository.find({
      where: { storeId },
      relations: ['user'],
    });

    return customerEntities.map(entity => this.mapEntityToCustomer(entity));
  }

  async getMyCustomersByStore(user: User, storeId: string): Promise<Customer[]> {
    if (!user || !user.id) {
      throw new UnauthorizedException('user_not_authenticated');
    }

    const customerEntities = await this.customerRepository.find({
      where: { storeId, userId: user.id },
      relations: ['store'],
    });

    return customerEntities.map(entity => this.mapEntityToCustomer(entity));
  }
}
