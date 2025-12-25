

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Post } from '../../posts/entities/post.entity';
import { News } from '../../news/entities/news.entity';
import { Friendship } from '../../friendships/entities/friendship.entity';
import { Message } from '../../messages/entities/message.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { Exclude } from 'class-transformer';
import { Vote } from '../../votes/entities/vote.entity';
import { Rank } from '../../ranks/entities/rank.entity';
import { ClanMember } from 'src/clans/entities/clan-member.entity';
import { ShopItem } from 'src/shop/entities/shop-item.entity';
import { Tag } from 'src/tags/entities/tag.entity';

@Entity('users')
@Index(["pending_email"], { unique: true, where: '"pending_email" IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 16, nullable: true, name: 'minecraft_username' })
  minecraft_username: string | null;

  @Index({ unique: true, where: '"profile_slug" IS NOT NULL' })
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true, name: 'profile_slug' })
  profile_slug: string | null;

  @Index({ unique: true, where: '"minecraft_uuid" IS NOT NULL' })
  @Column({ type: 'varchar', length: 36, unique: true, nullable: true, name: 'minecraft_uuid' })
  minecraft_uuid: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'first_login', default: () => 'CURRENT_TIMESTAMP' })
  first_login: Date;

  @Column({ type: 'varchar', length: 70, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'pfp_url' })
  pfp_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'banner_url' })
  banner_url: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_banned' })
  is_banned: boolean;

  @Column({ type: 'text', name: 'ban_reason', nullable: true })
  ban_reason: string | null;

  @Column({ type: 'timestamp', name: 'ban_expires_at', nullable: true })
  ban_expires_at: Date | null;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude({ toPlainOnly: true })
  password_hash: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'timestamp', name: 'email_verified_at', nullable: true, default: null })
  email_verified_at: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'email_verification_token' })
  @Exclude({ toPlainOnly: true })
  email_verification_token: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verification_token_expires' })
  @Exclude({ toPlainOnly: true })
  email_verification_token_expires: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'pending_email' })
  @Exclude({ toPlainOnly: true })
  pending_email: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'email_change_token' })
  @Exclude({ toPlainOnly: true })
  email_change_token: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'email_change_token_expires' })
  @Exclude({ toPlainOnly: true })
  email_change_token_expires: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'password_reset_token' })
  @Exclude({ toPlainOnly: true })
  password_reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'password_reset_token_expires' })
  @Exclude({ toPlainOnly: true })
  password_reset_token_expires: Date | null;

  @Column({ type: 'timestamp', name: 'last_login', nullable: true })
  last_login: Date | null;

  @Column({ type: 'integer', name: 'reputation_count', default: 0 })
  reputation_count: number;

  @Column({ type: 'boolean', default: false, name: 'is_minecraft_online' })
  is_minecraft_online: boolean;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  deleted_at: Date | null;

  @Column({ name: 'profile_frame_id', nullable: true })
  profile_frame_id: number | null;

  @ManyToOne(() => ShopItem, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'profile_frame_id' })
  profile_frame: ShopItem | null;

  @ManyToMany(() => Tag, (tag) => tag.users, { eager: true, cascade: true })
  @JoinTable({
    name: 'user_tags',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => News, (news) => news.author)
  news: News[];

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sent_friend_requests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.receiver)
  received_friend_requests: Friendship[];

  @OneToMany(() => Message, (message) => message.sender)
  sent_messages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  received_messages: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Purchase, (purchase) => purchase.user)
  purchases: Purchase[];

  @OneToMany(() => Vote, (vote) => vote.voter)
  votes: Vote[];

  @OneToOne(() => ClanMember, (clanMember) => clanMember.user)
  clanMembership: ClanMember;

  @ManyToOne(() => Rank, (rank) => rank.users, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'rank_id' })
  rank: Rank;

  @Column({ name: 'rank_id', nullable: true })
  rank_id: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_verified_youtuber' })
  is_verified_youtuber: boolean;

  async validatePassword(passwordToValidate: string): Promise<boolean> {
    if (!this.password_hash) return false;
    return bcrypt.compare(passwordToValidate, this.password_hash);
  }
}
