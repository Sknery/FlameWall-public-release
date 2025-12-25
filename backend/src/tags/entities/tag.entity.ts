import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';


@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, name: 'icon_url', nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @ManyToMany(() => User, (user) => user.tags)
  users: User[];
}

