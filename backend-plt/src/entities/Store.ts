import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '@/entities/User';
import { StoreManager } from '@/entities/StoreManager';
import { Order } from '@/entities/Order';
import { Product } from '@/entities/Product';
import { Employee } from '@/entities/Employee';
import { Customer } from '@/entities/Customer';
import { ShiftHandover } from '@/entities/ShiftHandover';
import { ProductType } from '@/entities/ProductType';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  storeCode: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, user => user.stores)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => StoreManager, storeManager => storeManager.store)
  managers: StoreManager[];

  @OneToMany(() => Order, order => order.store)
  orders: Order[];

  @OneToMany(() => Product, product => product.store)
  products: Product[];

  @OneToMany(() => Employee, employee => employee.store)
  employees: Employee[];

  @OneToMany(() => Customer, customer => customer.store)
  customers: Customer[];

  @OneToMany(() => ShiftHandover, shiftHandover => shiftHandover.store)
  shifts: ShiftHandover[];

  @OneToMany(() => ProductType, productType => productType.store)
  productTypes: ProductType[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
