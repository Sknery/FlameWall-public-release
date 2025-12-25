
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Logger } from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRanks } from '../ranks/ranks.service';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { PurchaseDto } from './dto/purchase.dto';
import { CreateShopDto, UpdateShopDto } from './dto/admin-shop.dto';

@Controller('shop')
export class ShopController {
  private readonly logger = new Logger(ShopController.name);

  constructor(private readonly shopService: ShopService) { }

  @Get()
  findAllActive() {
    this.logger.verbose('🔎 Fetching all active shop items for a user.');
    return this.shopService.findAllActive();
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  purchaseItem(@Body() purchaseDto: PurchaseDto, @Request() req) {
    this.logger.log(`[PURCHASE] 💳 User ID: ${req.user.userId} is attempting to purchase Item ID: ${purchaseDto.itemId} for target: "${purchaseDto.targetUsername || 'self'}".`);
    return this.shopService.purchase(purchaseDto, req.user.userId);
  }

  @Get('pending-commands')
  @UseGuards(PluginApiKeyGuard)
  getPendingCommands() {
    this.logger.log('[PLUGIN-FETCH] 🔌 Plugin is fetching pending commands.');
    return this.shopService.getPendingCommands();
  }

  @Post('clear-pending-commands')
  @UseGuards(PluginApiKeyGuard)
  clearPendingCommands(@Body('commandIds') commandIds: number[]) {
    this.logger.log(`[PLUGIN-CLEAR] 🔌 Plugin is clearing ${commandIds?.length || 0} executed command(s). IDs: [${commandIds?.join(', ')}]`);
    return this.shopService.clearPendingCommands(commandIds);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  create(@Body() createDto: CreateShopDto) {
    this.logger.log(`[ADMIN-CREATE] 📦 Admin is creating a new shop item: "${createDto.name}"`);
    return this.shopService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateShopDto) {
    this.logger.log(`[ADMIN-UPDATE] 📝 Admin is updating shop item ID: ${id}.`);
    return this.shopService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.warn(`[ADMIN-DELETE] 🗑️ Admin is deleting shop item ID: ${id}.`);
    return this.shopService.remove(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  findOne(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`[ADMIN-FIND-ONE] Admin is fetching shop item ID: ${id}.`);
    return this.shopService.findOne(id);
  }
}