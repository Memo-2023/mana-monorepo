import { Controller, Get, Param } from '@nestjs/common';
import { ThemeService } from './theme.service';

@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  async findAll() {
    return this.themeService.findAll();
  }

  @Get('default')
  async findDefault() {
    return this.themeService.findDefault();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.themeService.findOne(id);
  }
}
