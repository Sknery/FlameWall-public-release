
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request, Logger, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRanks } from '../ranks/ranks.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

const generateUniqueFilename = (req, file, callback) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = extname(file.originalname);
  callback(null, `${uniqueSuffix}${extension}`);
};

@ApiTags('Custom Pages')
@Controller()
export class PagesController {
  private readonly logger = new Logger(PagesController.name);
  constructor(private readonly pagesService: PagesService) { }

  @Get('p/:slug')
  @ApiOperation({ summary: 'Get a single published custom page by its slug' })
  findOnePublic(@Param('slug') slug: string) {
    this.logger.verbose(`[PUBLIC-REQ] 🗣️ Request for public page /p/${slug}`);
    return this.pagesService.findOnePublic(slug);
  }

  @Post('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new custom page (Admin only)' })
  create(@Body() createPageDto: CreatePageDto, @Request() req) {
    this.logger.log(`[ADMIN-REQ] ✨ User ID ${req.user.userId} is creating a new page.`);
    return this.pagesService.create(createPageDto, req.user.userId);
  }

  @Get('admin/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a list of all custom pages (Admin only)' })
  findAllForAdmin() {
    this.logger.verbose(`[ADMIN-REQ] Fetching all pages for admin panel.`);
    return this.pagesService.findAllForAdmin();
  }

  @Get('admin/pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single page by ID for editing (Admin only)' })
  findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    this.logger.verbose(`[ADMIN-REQ] 📥 Fetching page ${id} for editing.`);
    return this.pagesService.findOneForAdmin(id);
  }

  @Patch('admin/pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a custom page (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePageDto: UpdatePageDto) {
    this.logger.log(`[ADMIN-REQ] ✏️ Updating page ${id}.`);
    return this.pagesService.update(id, updatePageDto);
  }

  @Delete('admin/pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a custom page (Admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.warn(`[ADMIN-REQ] ❌ Deleting page ${id}.`);
    return this.pagesService.remove(id);
  }

  @Post('admin/pages/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/pages',      filename: generateUniqueFilename,
    }),
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(`[PAGE-IMAGE-UPLOAD] 🖼️ Uploaded image ${file.filename} for custom pages.`);
    return { url: `/uploads/pages/${file.filename}` };
  }

  @Get('pages/sidebar-categories')
  @ApiOperation({ summary: 'Get custom page categories for the sidebar' })
  findSidebarCategories() {
    return this.pagesService.findSidebarCategories();
  }

}
