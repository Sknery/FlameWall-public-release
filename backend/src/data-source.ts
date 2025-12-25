import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { ShopItem } from './shop/entities/shop-item.entity';
import { Post } from './posts/entities/post.entity';
import { Friendship } from './friendships/entities/friendship.entity';
import { Message } from './messages/entities/message.entity';
import { News } from './news/entities/news.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Comment } from './comments/entities/comment.entity';
import { Purchase } from './purchases/entities/purchase.entity';
import { LinkCode } from './linking/entities/link-code.entity';
import { Rank } from './ranks/entities/rank.entity';
import { Vote } from './votes/entities/vote.entity';
import { PendingCommand } from './shop/entities/pending-command.entity';

dotenv.config({ path: '.env' });

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: true,
    entities: [__dirname + '*.entity{.ts,.js}'],    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    subscribers: [],
});