import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BanReasonsController } from './ban-reasons.controller';
import { BanReasonsService } from './ban-reasons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BanReason } from './entities/ban-reason.entity';
import { AdminService } from './admin.service';
import { User } from 'src/users/entities/user.entity';
import { Post } from 'src/posts/entities/post.entity';
import { Purchase } from 'src/purchases/entities/purchase.entity';
import { ShopItem } from 'src/shop/entities/shop-item.entity';



@Module({
  imports: [TypeOrmModule.forFeature([BanReason, User, Post, Purchase, ShopItem])],
  controllers: [AdminController, BanReasonsController],
  providers: [BanReasonsService, AdminService],
})
export class AdminModule {}
