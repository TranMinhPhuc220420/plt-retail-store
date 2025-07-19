import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '@/entities/Store';
import { Employee } from '@/entities/Employee';

@Entity('shift_handovers')
export class ShiftHandover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column()
  shiftStartTime: Date;

  @Column()
  shiftEndTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  revenueCollected: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  expenses: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountHandedOver: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: 0 })
  numberOfItemsSold: number;

  @ManyToOne(() => Employee, employee => employee.shifts)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Store, store => store.shifts)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
