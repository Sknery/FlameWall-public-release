
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { ShopItem } from './entities/shop-item.entity';
import { PendingCommand } from './entities/pending-command.entity';
import { User } from '../users/entities/user.entity';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { Purchase } from '../purchases/entities/purchase.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopItem, PendingCommand, User, Purchase]),
  ],
  controllers: [ShopController],
  providers: [ShopService, PluginApiKeyGuard],
})
export class ShopModule {}