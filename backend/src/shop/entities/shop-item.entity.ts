
import { Purchase } from '../../purchases/entities/purchase.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum ShopItemType {
  COMMAND = 'COMMAND',  PROFILE_FRAME = 'PROFILE_FRAME',  AVATAR_FRAME = 'AVATAR_FRAME',  ANIMATED_AVATAR = 'ANIMATED_AVATAR',  ANIMATED_BANNER = 'ANIMATED_BANNER'}

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn({ name: 'item_id' })
  item_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  price: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  image_url: string | null;


  @Column({
    type: 'varchar',
    length: 50,
    name: 'item_type',
    default: ShopItemType.COMMAND
  })
  item_type: string;


  @Column({ type: 'jsonb', name: 'cosmetic_data', nullable: true })
  cosmetic_data: Record<string, any> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })  ingame_command: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'varchar', length: 50, default: 'items' })
  category: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Purchase, (purchase) => purchase.item)
  purchases: Purchase[];
}

