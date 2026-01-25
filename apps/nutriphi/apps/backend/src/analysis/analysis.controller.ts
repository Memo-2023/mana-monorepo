import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AnalysisService } from './analysis.service';
import { IsString, IsOptional } from 'class-validator';

class AnalyzePhotoDto {
	@IsString()
	imageBase64!: string;

	@IsOptional()
	@IsString()
	mimeType?: string;
}

class AnalyzeTextDto {
	@IsString()
	description!: string;
}

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
	constructor(private readonly analysisService: AnalysisService) {}

	@Post('photo')
	async analyzePhoto(@CurrentUser() _user: CurrentUserData, @Body() dto: AnalyzePhotoDto) {
		// TODO: Deduct credits from user account
		try {
			return await this.analysisService.analyzePhoto(dto.imageBase64, dto.mimeType);
		} catch (error) {
			throw new BadRequestException(
				`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	@Post('text')
	async analyzeText(@CurrentUser() _user: CurrentUserData, @Body() dto: AnalyzeTextDto) {
		// TODO: Deduct credits from user account
		try {
			return await this.analysisService.analyzeText(dto.description);
		} catch (error) {
			throw new BadRequestException(
				`Failed to analyze text: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}
