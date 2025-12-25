
import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRanks } from 'src/ranks/ranks.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Site Settings')
@Controller()
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get('settings')
    getPublicSettings() {
        return this.settingsService.getPublicSettings();
    }

    @Patch('admin/settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(SystemRanks.ADMIN.power_level)
    @ApiBearerAuth()
    updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
        return this.settingsService.updateSettings(updateSettingsDto);
    }
}