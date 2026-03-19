import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ThemeService } from './theme.service';

@ApiTags('Themes')
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
	async findOne(@Param('id', ParseUUIDPipe) id: string) {
		return this.themeService.findOne(id);
	}
}
