import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRanks } from 'src/ranks/ranks.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  create(@Body(ValidationPipe) createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }


  @Get()
  findAll() {
    return this.tagsService.findAll();
  }


  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  findAllForAdmin() {
    return this.tagsService.findAll();
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  update(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRanks.ADMIN.power_level)
  @ApiBearerAuth()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.remove(id);
  }
}

