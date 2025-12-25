

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RanksService } from './ranks.service';
import { RanksController } from './ranks.controller';
import { Rank } from './entities/rank.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rank, User])],
  controllers: [RanksController],
  providers: [RanksService],
  exports: [RanksService]})
export class RanksModule {}