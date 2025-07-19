import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Store } from '@/entities/Store';
import { StoreManager } from '@/entities/StoreManager';
import { Employee } from '@/entities/Employee';
import { Customer } from '@/entities/Customer';
import { ProductType } from '@/entities/ProductType';
import { Product } from '@/entities/Product';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  avatar: string;

  @Column({ unique: true })
  username: string;

  @Column()
  fullname: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Store, store => store.owner)
  stores: Store[];

  @OneToMany(() => StoreManager, storeManager => storeManager.user)
  storeManagers: StoreManager[];

  @OneToMany(() => Employee, employee => employee.user)
  employees: Employee[];

  @OneToMany(() => Customer, customer => customer.user)
  customers: Customer[];

  @OneToMany(() => ProductType, productType => productType.owner)
  productTypes: ProductType[];

  @OneToMany(() => Product, product => product.owner)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
