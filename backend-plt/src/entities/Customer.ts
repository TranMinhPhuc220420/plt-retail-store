import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@/entities/User';
import { Store } from '@/entities/Store';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => User, user => user.customers)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, store => store.customers)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
