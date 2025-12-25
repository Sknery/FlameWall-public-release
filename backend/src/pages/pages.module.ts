
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomPage } from './entities/page.entity';
import { User } from '../users/entities/user.entity';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { PageCategory } from './entities/page-category.entity';
import { PageCategoriesController } from './page-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomPage, User, PageCategory])],  providers: [PagesService],
  controllers: [PagesController, PageCategoriesController],})
export class PagesModule {}