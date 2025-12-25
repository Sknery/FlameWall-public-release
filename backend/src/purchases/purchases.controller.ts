

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)@ApiBearerAuth()
export class PurchasesController {
    constructor(private readonly purchasesService: PurchasesService) {}

    @Get('my-history')
    @ApiOperation({ summary: "Get the current user's purchase history" })
    getMyPurchaseHistory(@Request() req) {
        const userId = req.user.userId;
        return this.purchasesService.findUserPurchaseHistory(userId);
    }
}