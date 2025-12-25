
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SiteSettings } from './entities/setting.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SiteSettings])],
    providers: [SettingsService],
    controllers: [SettingsController],
})
export class SettingsModule {}