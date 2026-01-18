import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AnalysisService } from './analysis.service';
import { IsString, IsOptional } from 'class-validator';

class AnalyzePhotoDto {
	@IsString()
	photoId: string;

	@IsOptional()
	@IsString()
	plantId?: string;
}

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
	constructor(private readonly analysisService: AnalysisService) {}

	@Post('identify')
	async analyzePhoto(@CurrentUser() user: CurrentUserData, @Body() dto: AnalyzePhotoDto) {
		return this.analysisService.analyzePhoto(dto.photoId, user.userId, dto.plantId);
	}

	@Get(':photoId')
	async getAnalysis(@Param('photoId') photoId: string, @CurrentUser() user: CurrentUserData) {
		return this.analysisService.getAnalysis(photoId, user.userId);
	}
}
