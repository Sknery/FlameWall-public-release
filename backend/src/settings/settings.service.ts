
import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './entities/setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
    private readonly logger = new Logger(SettingsService.name);

    constructor(
        @InjectRepository(SiteSettings)
        private settingsRepository: Repository<SiteSettings>,
    ) { }

    async onModuleInit() {
        const settings = await this.settingsRepository.findOne({ where: { id: 1 } });
        if (!settings) {
            this.logger.log('No site settings found, creating default ones...');
            const defaultSettings = this.settingsRepository.create({
                id: 1,                site_name: 'FlameWall',
                accent_color: '#FF4D00',            });
            await this.settingsRepository.save(defaultSettings);
            this.logger.log('Default site settings created.');
        }
    }

    async getPublicSettings(): Promise<SiteSettings> {
        const settings = await this.settingsRepository.findOneBy({ id: 1 });
        if (!settings) {
            this.logger.error('CRITICAL: Site settings with ID 1 not found in the database!');
            throw new NotFoundException('Site settings not found.');
        }

        return settings;    }

    async updateSettings(dto: UpdateSettingsDto): Promise<SiteSettings> {
        const settings = await this.getPublicSettings();
        Object.assign(settings, dto);
        return this.settingsRepository.save(settings);
    }
}