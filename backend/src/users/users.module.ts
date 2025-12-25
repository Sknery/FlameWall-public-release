import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RanksModule } from '../ranks/ranks.module';
import { PendingCommand } from '../shop/entities/pending-command.entity';
import { Post } from '../posts/entities/post.entity';
import { Follow } from './entities/follow.entity';
import { TagsModule } from 'src/tags/tags.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, PendingCommand, Post, Follow]),
    RanksModule,
    TagsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
