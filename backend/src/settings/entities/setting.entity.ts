
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('site_settings')
export class SiteSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, default: 'FlameWall' })
  site_name: string;

  @Column({ type: 'varchar', length: 7, default: '#FFA500' })
  accent_color: string;

  @Column({ type: 'varchar', length: 255, name: 'logo_url', nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 255, name: 'favicon_url', nullable: true })
  favicon_url: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
