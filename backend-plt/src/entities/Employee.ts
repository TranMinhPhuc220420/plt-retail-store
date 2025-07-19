import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '@/entities/User';
import { Store } from '@/entities/Store';
import { ShiftHandover } from '@/entities/ShiftHandover';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column()
  position: string;

  @ManyToOne(() => User, user => user.employees)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, store => store.employees)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => ShiftHandover, shiftHandover => shiftHandover.employee)
  shifts: ShiftHandover[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
