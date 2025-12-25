
import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageCategory } from '../pages/entities/page-category.entity';
import { CustomPage } from 'src/pages/entities/page.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PageCategory, CustomPage])
  ],
  controllers: [NavigationController],
  providers: [NavigationService]
})
export class NavigationModule {}