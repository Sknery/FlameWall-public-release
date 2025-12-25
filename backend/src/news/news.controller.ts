

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
  Patch,
  Delete,
  Logger,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { News as NewsEntity } from './entities/news.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateNewsDto } from './dto/update-news.dto';
import { SystemRanks } from '../ranks/ranks.service';

@ApiTags('News')
@Controller('news')
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new news article (Admins/Mods only)' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createNewsDto: CreateNewsDto, @Request() req): Promise<NewsEntity> {
    const actorId = req.user.userId;
    this.logger.log(`[CREATE] 📰 User ID: ${actorId} is creating a news article titled: "${createNewsDto.name}"`);
    return this.newsService.create(createNewsDto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all news articles' })
  findAll(): Promise<NewsEntity[]> {
    this.logger.verbose(`[GET-ALL] 🔎 Fetching all news articles.`);
    return this.newsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific news article by ID' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<NewsEntity> {
    this.logger.verbose(`[GET-ONE] 🔎 Fetching news article with ID: ${id}`);
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a news article (Admins/Mods only)' })
  @UsePipes(new ValidationPipe({ whitelist: true, skipMissingProperties: true, forbidNonWhitelisted: true }))
  update(@Param('id', ParseIntPipe) id: number, @Body() updateNewsDto: UpdateNewsDto, @Request() req): Promise<NewsEntity> {
    this.logger.log(`[UPDATE] 📝 User ID: ${req.user.userId} is attempting to update news article ID: ${id}.`);
    return this.newsService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.MODERATOR.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a news article (Admins/Mods only)' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    this.logger.warn(`[DELETE] 🗑️ User ID: ${req.user.userId} is attempting to delete news article ID: ${id}.`);
    return this.newsService.remove(id);
  }
}