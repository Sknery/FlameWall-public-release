import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ShopItem } from '../../shop/entities/shop-item.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn({ name: 'purchase_id' })
  purchase_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'item_id' })
  item_id: number;

  @ManyToOne(() => ShopItem, (item) => item.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: ShopItem;

  @Column({ type: 'integer', name: 'purchase_price' })
  purchase_price: number;

  @CreateDateColumn({ type: 'timestamp', name: 'purchased_at', default: () => 'CURRENT_TIMESTAMP' })
  purchased_at: Date;

  @Column({ type: 'varchar', length: 20, default: 'COMPLETED' })
  status: string;
}