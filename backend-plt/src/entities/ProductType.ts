import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinColumn } from 'typeorm';
import { Store } from '@/entities/Store';
import { User } from '@/entities/User';
import { Product } from '@/entities/Product';

@Entity('product_types')
export class ProductType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => Store, store => store.productTypes)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => User, user => user.productTypes)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToMany(() => Product, product => product.categories)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
