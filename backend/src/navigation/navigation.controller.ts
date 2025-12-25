
import { Controller, Get } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  @Get('sidebar')
  getSidebarStructure() {
    return this.navigationService.getSidebarStructure();
  }
}