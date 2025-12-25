
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShopItem, ShopItemType } from './entities/shop-item.entity';
import { PendingCommand } from './entities/pending-command.entity';
import { User } from '../users/entities/user.entity';
import { PurchaseDto } from './dto/purchase.dto';
import { CreateShopDto, UpdateShopDto } from './dto/admin-shop.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Purchase } from '../purchases/entities/purchase.entity';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(
    @InjectRepository(ShopItem) private shopItemsRepository: Repository<ShopItem>,
    @InjectRepository(PendingCommand) private pendingCommandsRepository: Repository<PendingCommand>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) { }

  async findAllActive(): Promise<ShopItem[]> {
    return this.shopItemsRepository.findBy({ is_active: true });
  }

  async purchase(purchaseDto: PurchaseDto, buyerId: number): Promise<{ message: string }> {
    const { itemId, targetUsername } = purchaseDto;

    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOneBy(ShopItem, { item_id: itemId, is_active: true });
      if (!item) {
        throw new NotFoundException('Item not found or is not available for purchase.');
      }

      const buyer = await manager.findOneBy(User, { id: buyerId });
      if (!buyer) {
        throw new NotFoundException('Buyer account not found.');
      }

      if (buyer.balance < item.price) {
        throw new ForbiddenException('Insufficient funds.');
      }

      buyer.balance -= item.price;
      await manager.save(User, buyer);

      const newPurchase = manager.create(Purchase, {
        user_id: buyerId,
        item_id: itemId,
        purchase_price: item.price,
        status: 'COMPLETED',
      });
      await manager.save(Purchase, newPurchase);

      let message = `Successfully purchased "${item.name}"!`;

      if (item.item_type === ShopItemType.COMMAND) {
        let recipientName: string;
        if (targetUsername) {
            recipientName = targetUsername;
        } else {
            if (!buyer.minecraft_username) {
                throw new ForbiddenException('To buy for yourself, you must link your Minecraft account first.');
            }
            recipientName = buyer.minecraft_username;
        }

        if (item.ingame_command) {
            const finalCommand = item.ingame_command.replace('{username}', recipientName);
            const pendingCommand = manager.create(PendingCommand, { command: finalCommand });
            await manager.save(PendingCommand, pendingCommand);
            this.eventEmitter.emit('command.queued');
            message = `Successfully purchased "${item.name}" for ${recipientName}! The item will be delivered in-game shortly.`;
        } else {
            this.logger.warn(`Item ${item.item_id} of type COMMAND has no ingame_command set.`);
        }
      } else if (item.item_type === ShopItemType.PROFILE_FRAME) {
        message = `Successfully purchased "${item.name}"! You can equip it from your profile page.`;
      }

      this.logger.log(`[PURCHASE-SUCCESS] ✅ User ID: ${buyerId} purchased Item ID: ${item.item_id} (Type: ${item.item_type}). Price: ${item.price}. New balance: ${buyer.balance}.`);

      return { message };
    });
  }

  async getPendingCommands(): Promise<PendingCommand[]> {
    const commands = await this.pendingCommandsRepository.find();
    this.logger.verbose(`[PLUGIN-FETCH-SUCCESS] 💾 Found ${commands.length} pending commands for the plugin.`);
    return commands;
  }

  async clearPendingCommands(commandIds: number[]): Promise<void> {
    if (commandIds && commandIds.length > 0) {
      await this.pendingCommandsRepository.delete(commandIds);
      this.logger.warn(`[PLUGIN-CLEAR-SUCCESS] ✅ Cleared ${commandIds.length} command(s) from the database.`);
    }
  }

  async create(createDto: CreateShopDto): Promise<ShopItem> {
    const newItem = this.shopItemsRepository.create(createDto);
    const savedItem = await this.shopItemsRepository.save(newItem);
    this.logger.log(`[ADMIN-CREATE-SUCCESS] ✅ Created new shop item "${savedItem.name}" with ID: ${savedItem.item_id}.`);
    return savedItem;
  }

  async update(id: number, updateDto: UpdateShopDto): Promise<ShopItem> {
    await this.shopItemsRepository.update(id, updateDto);
    const updatedItem = await this.shopItemsRepository.findOneBy({ item_id: id });
    if (!updatedItem) {
      this.logger.error(`[ADMIN-UPDATE-FAIL] ❌ Shop item with ID ${id} not found after update operation.`);
      throw new NotFoundException('Item not found');
    }
    this.logger.log(`[ADMIN-UPDATE-SUCCESS] ✅ Updated shop item ID: ${id}.`);
    return updatedItem;
  }

  async remove(id: number): Promise<void> {
    const result = await this.shopItemsRepository.delete(id);
    if (result.affected === 0) {
      this.logger.error(`[ADMIN-DELETE-FAIL] ❌ Shop item with ID ${id} not found for deletion.`);
      throw new NotFoundException('Item not found');
    }
    this.logger.warn(`[ADMIN-DELETE-SUCCESS] ✅ Deleted shop item ID: ${id}.`);
  }

  async findOne(id: number): Promise<ShopItem> {
    const item = await this.shopItemsRepository.findOneBy({ item_id: id });
    if (!item) {
      this.logger.warn(`[ADMIN-FIND-ONE] Shop item with ID ${id} not found.`);
      throw new NotFoundException(`Shop item with ID ${id} not found`);
    }
    return item;
  }
}
