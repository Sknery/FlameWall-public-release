
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageCategoryDto } from './dto/create-page-category.dto';
import { UpdatePageCategoryDto } from './dto/update-page-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRanks } from '../ranks/ranks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin / Pages')
@Controller('admin/page-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemRanks.ADMIN.power_level)
@ApiBearerAuth()
export class PageCategoriesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  createCategory(@Body() createDto: CreatePageCategoryDto) {
    return this.pagesService.createCategory(createDto);
  }

  @Get()
  findAllCategories() {
    return this.pagesService.findAllCategories();
  }

  @Patch(':id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePageCategoryDto) {
    return this.pagesService.updateCategory(id, updateDto);
  }

  @Delete(':id')
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.removeCategory(id);
  }
}