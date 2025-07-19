import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '@/entities/Store';
import { User } from '@/entities/User';

@Entity('store_managers')
export class StoreManager {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Store, store => store.managers)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => User, user => user.storeManagers)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
