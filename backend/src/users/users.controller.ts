

import {
  Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, Patch, UseGuards, Request, Delete, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, Logger, BadRequestException, Query, ParseIntPipe,
  NotFoundException
} from '@nestjs/common';
import { PublicUser, UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UpdateProfileResponseDto } from './dto/update-profile-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { FindAllPostsDto } from '../posts/dto/find-all-posts';
import { ShopItemType } from 'src/shop/entities/shop-item.entity';
import { UpdateUserTagsDto } from './dto/update-user-tags.dto';


const generateUniqueFilename = (req, file, callback) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = extname(file.originalname);
  callback(null, `${uniqueSuffix}${extension}`);
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user (for future admin use)' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`[CREATE] 👤 Admin is creating a new user: ${createUserDto.email}`);
    return this.usersService.create(createUserDto);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my profile' })
  updateMyProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<{ user: PublicUser; access_token: string; }> {
    const userId = req.user.userId;
    this.logger.log(`[UPDATE-ME] 📝 User ID: ${userId} is updating their own profile.`);
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete my account' })
  deleteMyAccount(@Request() req): Promise<void> {
    const userId = req.user.userId;
    this.logger.warn(`[DELETE-ME] 🗑️ User ID: ${userId} is soft-deleting their own account.`);
    return this.usersService.softDeleteUser(userId);
  }


  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user's personalized post feed" })
  getFeed(@Request() req, @Query(new ValidationPipe({ transform: true, forbidNonWhitelisted: true })) query: FindAllPostsDto) {
    const userId = req.user.userId;
    return this.usersService.getFollowingPostsFeed(userId, query);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the list of users the current user is following" })
  getFollowingList(@Request() req) {
    const userId = req.user.userId;
    return this.usersService.getFollowingList(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll(@Query(new ValidationPipe({ transform: true, forbidNonWhitelisted: true })) query: FindAllUsersDto): Promise<{ data: PublicUser[], total: number }> {
    this.logger.verbose(`[GET-ALL] 🔎 Fetching all users with query: ${JSON.stringify(query)}`);
    return this.usersService.findAll(query);
  }

  // All "me/" routes must be declared before ":identifier" route to avoid conflicts
  @Get('me/cosmetics/:itemType')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my owned cosmetic items of a specific type' })
  getMyCosmetics(@Request() req, @Param('itemType') itemType: ShopItemType) {
      return this.usersService.getOwnedCosmetics(req.user.userId, itemType);
  }

  @Post('me/equip-frame')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Equip a profile frame' })
  equipFrame(@Request() req, @Body('itemId') itemId: number | null) {
      return this.usersService.equipProfileFrame(req.user.userId, itemId);
  }

  @Post('me/equip-animated-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Equip an animated avatar' })
  equipAnimatedAvatar(@Request() req, @Body('itemId') itemId: number | null) {
      return this.usersService.equipAnimatedAvatar(req.user.userId, itemId);
  }

  @Post('me/equip-animated-banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Equip an animated banner' })
  equipAnimatedBanner(@Request() req, @Body('itemId') itemId: number | null) {
      return this.usersService.equipAnimatedBanner(req.user.userId, itemId);
  }

  @Post('me/unlink-minecraft')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink Minecraft account from my profile' })
  unlinkMinecraftAccount(@Request() req) {
    const userId = req.user.userId;
    this.logger.log(`[UNLINK-MC] 🔗 User ID: ${userId} is unlinking their Minecraft account.`);
    return this.usersService.unlinkMinecraftAccount(userId);
  }

  @Patch('me/tags')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user's tags" })
  updateMyTags(@Request() req, @Body() updateUserTagsDto: UpdateUserTagsDto) {
    return this.usersService.updateUserTags(req.user.userId, updateUserTagsDto.tagIds);
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get a single user by ID or slug' })
  findOne(@Param('identifier') identifier: string) {
    this.logger.verbose(`[GET-ONE] 🔎 Fetching user with identifier: '${identifier}'`);
    const idAsNumber = parseInt(identifier, 10);
    const queryIdentifier = isNaN(idAsNumber) ? identifier : idAsNumber;
    return this.usersService.findOne(queryIdentifier);
  }

  @Get(':identifier/posts')
  @ApiOperation({ summary: "Get a user's posts with pagination" })
  async getPostsForUser(
    @Param('identifier') identifier: string,
    @Query(new ValidationPipe({ transform: true, forbidNonWhitelisted: true })) query: FindAllPostsDto
  ) {
    const user = await this.usersService.findOne(identifier);
    return this.usersService.findPostsForUser(user.id, query);
  }

  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Follow a user' })
  followUser(@Param('userId', ParseIntPipe) userId: number, @Request() req) {
    const followerId = req.user.userId;
    return this.usersService.follow(followerId, userId);
  }

  @Delete(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollowUser(@Param('userId', ParseIntPipe) userId: number, @Request() req) {
    const followerId = req.user.userId;
    return this.usersService.unfollow(followerId, userId);
  }

  @Get(':userId/follow-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if the current user is following another user' })
  async getFollowStatus(@Param('userId', ParseIntPipe) userId: number, @Request() req) {
    const followerId = req.user.userId;
    const isFollowing = await this.usersService.isFollowing(followerId, userId);
    return { following: isFollowing };
  }
}
