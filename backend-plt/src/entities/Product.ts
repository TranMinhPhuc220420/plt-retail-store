import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { User } from '@/entities/User';
import { Store } from '@/entities/Store';
import { ProductType } from '@/entities/ProductType';
import { OrderItem } from '@/entities/OrderItem';
import { ProductImage } from '@/entities/ProductImage';
import { InventoryTransaction } from '@/entities/InventoryTransaction';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  productCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  retailPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  wholesalePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column()
  minStock: number;

  @Column()
  unit: string;

  @Column()
  status: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => User, user => user.products)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Store, store => store.products)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToMany(() => ProductType, productType => productType.products)
  @JoinTable()
  categories: ProductType[];

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => ProductImage, productImage => productImage.product)
  images: ProductImage[];

  @OneToMany(() => InventoryTransaction, inventoryTransaction => inventoryTransaction.product)
  inventoryTransactions: InventoryTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
