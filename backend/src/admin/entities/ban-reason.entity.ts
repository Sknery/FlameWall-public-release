import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';


@Entity('ban_reasons')
export class BanReason {

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: 'varchar', length: 255 })
  reason: string;


  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
