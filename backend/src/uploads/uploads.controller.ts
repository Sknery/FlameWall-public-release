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

    @Post('media/crop-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ 
        schema: { 
            type: 'object', 
            properties: { 
                file: { type: 'string', format: 'binary' },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                imageWidth: { type: 'number' },
                imageHeight: { type: 'number' }
            } 
        } 
    })
    async cropImage(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ) {
        if (!file) throw new BadRequestException('File is required');
        
        // Log received data for debugging
        this.logger.log(`Crop request - body keys: ${Object.keys(req.body || {}).join(', ')}, file: ${file.originalname}, type: ${file.mimetype}`);
        this.logger.log(`Crop request - body values: ${JSON.stringify(req.body)}`);
        
        // Parse crop parameters from form data
        // In multipart/form-data with multer, values come as strings in req.body
        const getParam = (key: string): string => {
            const value = req.body?.[key];
            if (Array.isArray(value)) return value[0];
            return value || '0';
        };
        
        const cropX = parseFloat(getParam('x'));
        const cropY = parseFloat(getParam('y'));
        const cropWidth = parseFloat(getParam('width'));
        const cropHeight = parseFloat(getParam('height'));
        const imageWidth = parseFloat(getParam('imageWidth'));
        const imageHeight = parseFloat(getParam('imageHeight'));

        this.logger.log(`Parsed crop params: x=${cropX}, y=${cropY}, width=${cropWidth}, height=${cropHeight}, imgW=${imageWidth}, imgH=${imageHeight}`);

        // Validate parameters
        if (isNaN(cropX) || isNaN(cropY) || isNaN(cropWidth) || isNaN(cropHeight) || 
            isNaN(imageWidth) || isNaN(imageHeight) || 
            cropWidth <= 0 || cropHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
            const errorMsg = `Invalid crop parameters: x=${cropX}, y=${cropY}, width=${cropWidth}, height=${cropHeight}, imgW=${imageWidth}, imgH=${imageHeight}. Body: ${JSON.stringify(req.body)}`;
            this.logger.error(errorMsg);
            throw new BadRequestException(errorMsg);
        }
        
        // Check if values are already in pixels (if width > 100, assume pixels)
        // or in percentages (if width <= 100, assume percentages)
        const isPixels = cropWidth > 100 || cropHeight > 100;
        
        let clampedCropX, clampedCropY, clampedCropWidth, clampedCropHeight;
        
        if (isPixels) {
            // Values are already in pixels, clamp to image bounds
            clampedCropX = Math.max(0, Math.min(imageWidth - 1, cropX));
            clampedCropY = Math.max(0, Math.min(imageHeight - 1, cropY));
            clampedCropWidth = Math.max(1, Math.min(imageWidth - clampedCropX, cropWidth));
            clampedCropHeight = Math.max(1, Math.min(imageHeight - clampedCropY, cropHeight));
            this.logger.log(`Crop parameters are in pixels, clamping to bounds`);
        } else {
            // Values are in percentages, clamp to 0-100%
            clampedCropX = Math.max(0, Math.min(100, cropX));
            clampedCropY = Math.max(0, Math.min(100, cropY));
            clampedCropWidth = Math.max(0, Math.min(100, cropWidth));
            clampedCropHeight = Math.max(0, Math.min(100, cropHeight));
            
            if (clampedCropX !== cropX || clampedCropY !== cropY || clampedCropWidth !== cropWidth || clampedCropHeight !== cropHeight) {
                this.logger.warn(`Crop parameters clamped: x=${cropX}->${clampedCropX}, y=${cropY}->${clampedCropY}, width=${cropWidth}->${clampedCropWidth}, height=${cropHeight}->${clampedCropHeight}`);
            }
        }

        const isAnimated = file.mimetype === 'image/gif' || file.mimetype === 'image/avif';
        
        try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = extname(file.originalname) || (file.mimetype === 'image/gif' ? '.gif' : 
                                                       file.mimetype === 'image/avif' ? '.avif' : '.png');
            const filename = `${uniqueSuffix}${ext}`;
            const filepath = join(this.uploadBaseDir, 'shop', filename);

            // Convert to pixels (either already in pixels or convert from percentages)
            // IMPORTANT: sharp.extract() requires INTEGER values, so we must round all coordinates
            let pixelX, pixelY, pixelWidth, pixelHeight;
            
            if (isPixels) {
                // Already in pixels, round to integers and clamp to image bounds
                pixelX = Math.max(0, Math.min(imageWidth - 1, Math.round(clampedCropX)));
                pixelY = Math.max(0, Math.min(imageHeight - 1, Math.round(clampedCropY)));
                pixelWidth = Math.max(1, Math.min(imageWidth - pixelX, Math.round(clampedCropWidth)));
                pixelHeight = Math.max(1, Math.min(imageHeight - pixelY, Math.round(clampedCropHeight)));
            } else {
                // Convert from percentages to pixels and round to integers
                pixelX = Math.max(0, Math.min(imageWidth - 1, Math.round((clampedCropX / 100) * imageWidth)));
                pixelY = Math.max(0, Math.min(imageHeight - 1, Math.round((clampedCropY / 100) * imageHeight)));
                pixelWidth = Math.max(1, Math.min(imageWidth - pixelX, Math.round((clampedCropWidth / 100) * imageWidth)));
                pixelHeight = Math.max(1, Math.min(imageHeight - pixelY, Math.round((clampedCropHeight / 100) * imageHeight)));
            }
            
            // Ensure minimum size
            if (pixelWidth <= 0 || pixelHeight <= 0) {
                throw new BadRequestException(`Invalid crop area: width=${pixelWidth}, height=${pixelHeight}. Crop area must be within image bounds.`);
            }
            
            // Ensure all values are integers (sharp requires integers)
            pixelX = Math.round(pixelX);
            pixelY = Math.round(pixelY);
            pixelWidth = Math.round(pixelWidth);
            pixelHeight = Math.round(pixelHeight);
            
            // Final validation - ensure values are within bounds and are integers
            pixelX = Math.max(0, Math.min(imageWidth - 1, pixelX));
            pixelY = Math.max(0, Math.min(imageHeight - 1, pixelY));
            pixelWidth = Math.max(1, Math.min(imageWidth - pixelX, pixelWidth));
            pixelHeight = Math.max(1, Math.min(imageHeight - pixelY, pixelHeight));
            
            this.logger.log(`Final crop pixels (integers): x=${pixelX}, y=${pixelY}, width=${pixelWidth}, height=${pixelHeight} (image: ${imageWidth}x${imageHeight})`);

            // For animated formats, use animated option to preserve all frames
            let pipeline = sharp(file.buffer, { animated: isAnimated });

            if (isAnimated) {
                // For animated formats, use extract to crop while preserving animation
                // The animated option ensures all frames are processed
                // IMPORTANT: All values must be integers
                pipeline = pipeline.extract({
                    left: pixelX,
                    top: pixelY,
                    width: pixelWidth,
                    height: pixelHeight
                });
                
                // Explicitly set output format to preserve animation
                if (file.mimetype === 'image/gif') {
                    // GIF: preserve format
                    pipeline = pipeline.gif();
                    await pipeline.toFile(filepath);
                    this.logger.log(`Cropped animated GIF saved to ${filepath}`);
                    return { url: `/uploads/shop/${filename}` };
                } else if (file.mimetype === 'image/avif') {
                    // AVIF: Sharp does NOT support animated AVIF processing
                    // According to Sharp documentation and GitHub issues, animated AVIF is not supported
                    // We return the original file without cropping to preserve animation
                    // GIF format is recommended for animated images that need cropping
                    this.logger.warn('AVIF cropping skipped - Sharp does not support animated AVIF. Returning original file to preserve animation.');
                    
                    // Save original file as-is to preserve animation
                    const ext = extname(file.originalname) || '.avif';
                    const filename = `${uniqueSuffix}${ext}`;
                    const filepath = join(this.uploadBaseDir, 'shop', filename);
                    
                    await fs.writeFile(filepath, file.buffer);
                    this.logger.log(`Original AVIF file saved (no cropping) to ${filepath}`);
                    
                    return { 
                        url: `/uploads/shop/${filename}`,
                        warning: 'AVIF cropping is not supported. Original file used to preserve animation. For animated images that need cropping, please use GIF format.'
                    };
                }
            } else {
                // For static formats, use extract and convert to appropriate format
                pipeline = pipeline.extract({
                    left: pixelX,
                    top: pixelY,
                    width: pixelWidth,
                    height: pixelHeight
                });
                
                // Convert to WebP for better compression (except for PNG which should stay PNG)
                if (file.mimetype !== 'image/png') {
                    pipeline = pipeline.webp({ quality: 80 });
                    const webpFilename = `${uniqueSuffix}.webp`;
                    const webpFilepath = join(this.uploadBaseDir, 'shop', webpFilename);
                    await pipeline.toFile(webpFilepath);
                    this.logger.log(`Cropped image saved to ${webpFilepath}`);
                    return { url: `/uploads/shop/${webpFilename}` };
                } else {
                    // PNG: preserve format
                    await pipeline.toFile(filepath);
                    this.logger.log(`Cropped PNG saved to ${filepath}`);
                    return { url: `/uploads/shop/${filename}` };
                }
            }
        } catch (error) {
            this.logger.error('Error cropping image:', error);
            throw new BadRequestException(`Failed to crop image: ${error.message}. The file might be corrupted or unsupported.`);
        }
    }
}