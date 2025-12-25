
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CustomPage } from './page.entity';

@Entity('page_categories')
export class PageCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  display_order: number;

  @OneToMany(() => CustomPage, (page) => page.category)
  pages: CustomPage[];
}