
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pending_commands')
export class PendingCommand {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    command: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}