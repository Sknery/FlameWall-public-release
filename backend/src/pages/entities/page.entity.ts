
import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PageCategory } from './page-category.entity';

@Entity('custom_pages')
export class CustomPage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index({ unique: true })  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text' })  content: string;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ name: 'author_id' })
  author_id: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'category_id', nullable: true })
  category_id: number | null;

  @ManyToOne(() => PageCategory, (category) => category.pages, {
    onDelete: 'SET NULL',    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: PageCategory | null;

}