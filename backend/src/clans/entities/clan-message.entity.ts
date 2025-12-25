import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Clan } from './clan.entity';
import { User } from '../../users/entities/user.entity';


export enum ClanChatChannel {
    GENERAL = 'general',
    ADMIN = 'admin',
}


@Entity('clan_messages')
export class ClanMessage {

    @PrimaryGeneratedColumn()
    id: number;


    @Column()
    clan_id: number;


    @ManyToOne(() => Clan, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clan_id' })
    clan: Clan;


    @Column({ nullable: true })
    author_id: number | null;


    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'author_id' })
    author: User | null;


    @Column({ type: 'text' })
    content: string;


    @Column({
        type: 'enum',
        enum: ClanChatChannel,
        default: ClanChatChannel.GENERAL
    })
    channel: ClanChatChannel;


    @ManyToOne(() => ClanMessage, (message) => message.replies, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'parent_id' })
    parent: ClanMessage | null;


    @Column({ name: 'parent_id', nullable: true })
    parent_id: number | null;


    @OneToMany(() => ClanMessage, (message) => message.parent)
    replies: ClanMessage[];


    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
}
