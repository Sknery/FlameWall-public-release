

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Query,
  Logger,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post as PostEntity } from './entities/post.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { FindAllPostsDto } from './dto/find-all-posts';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createPostDto: CreatePostDto, @Request() req): Promise<PostEntity> {
    const authorId = req.user.userId;
    this.logger.log(`[CREATE] 💬 User ID: ${authorId} is creating a new post titled "${createPostDto.title}"`);
    return this.postsService.create(createPostDto, authorId);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)  @ApiOperation({ summary: 'Get all posts' })
  findAll(
    @Query(new ValidationPipe({ transform: true, forbidNonWhitelisted: true })) query: FindAllPostsDto,
    @Request() req,  ) {
    const userId = req.user ? req.user.userId : null;
    this.logger.verbose(`[GET-ALL] 🔎 Fetching all posts with query: ${JSON.stringify(query)} for User ID: ${userId || 'Guest'}`);
    return this.postsService.findAll(query, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific post by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user ? req.user.userId : null;
    this.logger.verbose(`[GET-ONE] 🔎 Fetching post ID: ${id} for User ID: ${userId || 'Guest'}`);
    return this.postsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @UsePipes(new ValidationPipe({ whitelist: true, skipMissingProperties: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ): Promise<PostEntity> {
    const userId = req.user.userId;
    this.logger.log(`[UPDATE] 📝 User ID: ${userId} is attempting to update Post ID: ${id}`);
    return this.postsService.update(id, updatePostDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    const userId = req.user.userId;
    this.logger.warn(`[DELETE] 🗑️ User ID: ${userId} is attempting to delete Post ID: ${id}`);
    return this.postsService.remove(id, userId);
  }
}
