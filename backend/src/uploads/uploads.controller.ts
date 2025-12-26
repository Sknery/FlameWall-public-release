import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Logger,
    Request,
    BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRanks } from 'src/ranks/ranks.service';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import * as sharp from 'sharp';
import { join, extname } from 'path';
import { promises as fs } from 'fs';

@ApiTags('Uploads')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);
    private readonly uploadBaseDir = './uploads';

    constructor(private readonly usersService: UsersService) {
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        const dirs = ['avatars', 'banners', 'content', 'site', 'shop', 'achievements', 'tags', 'clans', 'pages'];
        for (const dir of dirs) {
            await fs.mkdir(join(this.uploadBaseDir, dir), { recursive: true });
        }
    }


    private async processAndSaveImage(
        file: Express.Multer.File,
        folder: string,
        options: { width?: number; height?: number; fit?: keyof sharp.FitEnum; preserveGif?: boolean } = {}
    ): Promise<string> {
        if (!file) throw new BadRequestException('File is empty');

        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
        if (!allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException('Unsupported file type. Use JPG, PNG, WebP, GIF, or AVIF.');
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const isAnimated = file.mimetype === 'image/gif' || file.mimetype === 'image/avif';
        const preserveGif = options.preserveGif !== false && isAnimated;
        
        // For animated files (GIF/AVIF) that should be preserved, save them directly without processing
        if (preserveGif) {
            const ext = extname(file.originalname) || (file.mimetype === 'image/gif' ? '.gif' : '.avif');
            const filename = `${uniqueSuffix}${ext}`;
            const filepath = join(this.uploadBaseDir, folder, filename);
            
            try {
                await fs.writeFile(filepath, file.buffer);
                this.logger.log(`Animated file (${file.mimetype}) saved directly to ${filepath}`);
                return `/uploads/${folder}/${filename}`;
            } catch (error) {
                this.logger.error(`Failed to save animated file for ${folder}`, error);
                throw new BadRequestException(`Failed to save ${file.mimetype} file.`);
            }
        }

        const filename = `${uniqueSuffix}.webp`;
        const filepath = join(this.uploadBaseDir, folder, filename);

        try {
            let pipeline = sharp(file.buffer);

            if (options.width || options.height) {
                pipeline = pipeline.resize({
                    width: options.width,
                    height: options.height,
                    fit: options.fit || 'cover',
                    withoutEnlargement: true
                });
            }

            await pipeline
                .webp({ quality: 80 })
                .toFile(filepath);

            this.logger.log(`Image processed and saved to ${filepath}`);

            return `/uploads/${folder}/${filename}`;
        } catch (error) {
            this.logger.error(`Failed to process image for ${folder}`, error);
            throw new BadRequestException('Failed to process image. The file might be corrupted.');
        }
    }

    @Post('media/editor-image')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
    async uploadEditorFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
        const url = await this.processAndSaveImage(file, 'content', { width: 1920, fit: 'inside' });
        this.logger.log(`User ID: ${req.user.userId} uploaded content image: ${url}`);
        return { url };
    }

    @Post('media/site-asset')
    @UseGuards(RolesGuard)
    @Roles(SystemRanks.ADMIN.power_level)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadSiteAsset(@UploadedFile() file: Express.Multer.File) {
        const url = await this.processAndSaveImage(file, 'site', { width: 1024, fit: 'inside' });
        return { url };
    }

    @Post('media/shop-item')
    @UseGuards(RolesGuard)
    @Roles(SystemRanks.ADMIN.power_level)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadShopItemImage(@UploadedFile() file: Express.Multer.File) {
        // Preserve GIF files for animated avatars and banners
        const url = await this.processAndSaveImage(file, 'shop', { width: 512, height: 512, fit: 'cover', preserveGif: true });
        return { url };
    }

    @Post('media/avatar')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
        const userId = req.user.userId;
        const url = await this.processAndSaveImage(file, 'avatars', { width: 400, height: 400, fit: 'cover' });

        await this.usersService.updateAvatar(userId, url);
        return { url };
    }

    @Post('media/banner')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadBanner(@UploadedFile() file: Express.Multer.File, @Request() req) {
        const userId = req.user.userId;
        const url = await this.processAndSaveImage(file, 'banners', { width: 1200, height: 400, fit: 'cover' });

        await this.usersService.updateBanner(userId, url);
        return { url };
    }

    @Post('media/achievement-icon')
    @UseGuards(RolesGuard)
    @Roles(SystemRanks.ADMIN.power_level)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadAchievementIcon(@UploadedFile() file: Express.Multer.File) {
        const url = await this.processAndSaveImage(file, 'achievements', { width: 256, height: 256, fit: 'contain' });
        return { url };
    }

    @Post('media/tag-icon')
    @UseGuards(RolesGuard)
    @Roles(SystemRanks.ADMIN.power_level)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadTagIcon(@UploadedFile() file: Express.Multer.File) {
        const url = await this.processAndSaveImage(file, 'tags', { width: 128, height: 128, fit: 'contain' });
        return { url };
    }

    @Post('media/clan-icon')
    @UseGuards(RolesGuard)
    @Roles(SystemRanks.MODERATOR.power_level)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadClanIcon(@UploadedFile() file: Express.Multer.File) {
        const url = await this.processAndSaveImage(file, 'clans', { width: 256, height: 256, fit: 'cover' });
        return { url };
    }

    @Post('media/clan-banner')
    @UseGuards(RolesGuard)
    @Roles(SystemRanks.MODERATOR.power_level)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    async uploadClanBanner(@UploadedFile() file: Express.Multer.File) {
        const url = await this.processAndSaveImage(file, 'clans', { width: 1200, height: 400, fit: 'cover' });
        return { url };
    }
}