import { Controller, Post, Param, ParseIntPipe, UseGuards, Body, Patch, Request, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService, PublicUser } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { SystemRanks } from '../ranks/ranks.service';
import { BanUserDto } from '../admin/dto/ban-user.dto';
import { AdminService } from './admin.service';


@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
    private readonly logger = new Logger(AdminController.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly adminService: AdminService,
    ) { }

    @Get('/user-stats')
    @Roles(SystemRanks.MODERATOR.power_level)
    @ApiOperation({ summary: 'Get user statistics for the admin dashboard' })
    getUserStats() {
        this.logger.log(`[STATS] 📊 Admin is fetching user statistics.`);
        return this.adminService.getUserStats();
    }

    @Get('/post-stats')
    @Roles(SystemRanks.MODERATOR.power_level)
    @ApiOperation({ summary: 'Get post statistics for the admin dashboard' })
    getPostStats() {
        this.logger.log(`[STATS] 📰 Admin is fetching post statistics.`);
        return this.adminService.getPostStats();
    }

    @Get('/shop-stats')
    @Roles(SystemRanks.MODERATOR.power_level)
    @ApiOperation({ summary: 'Get shop statistics for the admin dashboard' })
    getShopStats() {
        this.logger.log(`[STATS] 🛒 Admin is fetching shop statistics.`);
        return this.adminService.getShopStats();
    }

    @Get('/users/:id/details')
    @Roles(SystemRanks.MODERATOR.power_level)
    @ApiOperation({ summary: 'Get detailed (admin-only) user info' })
    getUserDetails(@Param('id', ParseIntPipe) id: number) {
        this.logger.log(`[DETAILS] 🕵️ Admin is fetching details for User ID: ${id}.`);
        return this.adminService.getUserDetails(id);
    }


    @Post('/users/:id/ban')
    @Roles(SystemRanks.MODERATOR.power_level)
    @ApiOperation({ summary: 'Ban a user' })
    @ApiResponse({ status: 200, description: 'User has been banned successfully.' })
    banUser(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() banDto: BanUserDto
    ): Promise<PublicUser> {
        const actorId = req.user.userId;
        this.logger.warn(`[BAN] 🚫 Actor ID: ${actorId} is banning User ID: ${id}. Reason: ${banDto.reason}`);
        return this.usersService.banUser(id, banDto);
    }


    @Post('/users/:id/unban')
    @Roles(SystemRanks.ADMIN.power_level)
    @ApiOperation({ summary: 'Unban a user' })
    @ApiResponse({ status: 200, description: 'User has been unbanned successfully.' })
    unbanUser(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ): Promise<PublicUser> {
        const actorId = req.user.userId;
        this.logger.log(`[UNBAN] ✅ Actor ID: ${actorId} is unbanning User ID: ${id}`);
        return this.usersService.unbanUser(id);
    }


    @Patch('/users/:id/update')
    @Roles(SystemRanks.ADMIN.power_level)
    @ApiOperation({ summary: 'Update a user by admin' })
    @ApiResponse({ status: 200, description: 'User has been updated successfully.' })
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() adminUpdateUserDto: AdminUpdateUserDto,
        @Request() req,
    ): Promise<PublicUser> {
        const actorId = req.user.userId;
        this.logger.log(`[UPDATE] 📝 Actor ID: ${actorId} is updating User ID: ${id}. Data: ${JSON.stringify(adminUpdateUserDto)}`);
        return this.usersService.adminUpdateUser(id, adminUpdateUserDto, actorId);
    }
}
