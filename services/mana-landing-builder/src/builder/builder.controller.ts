import { Controller, Post, Body, Get, Logger, HttpCode } from '@nestjs/common';
import { BuilderService, type BuildResult } from './builder.service';
import { BuildLandingDto } from './dto/build-landing.dto';

@Controller()
export class BuilderController {
	private readonly logger = new Logger(BuilderController.name);

	constructor(private readonly builderService: BuilderService) {}

	@Post('build')
	@HttpCode(200)
	async buildLanding(@Body() dto: BuildLandingDto): Promise<BuildResult> {
		this.logger.log(`Build requested for org: ${dto.slug}`);
		return this.builderService.build(dto);
	}

	@Get('health')
	health() {
		return { status: 'ok', service: 'mana-landing-builder' };
	}
}
