import { Controller, Get, Post, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ReviewService } from './review.service';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateReviewDto {
	@IsInt()
	@Min(1)
	@Max(5)
	@Type(() => Number)
	rating!: number;

	@IsString()
	@IsOptional()
	comment?: string;
}

@Controller('reviews')
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Get(':locationId')
	async findByLocation(@Param('locationId') locationId: string) {
		const [reviewsList, stats] = await Promise.all([
			this.reviewService.findByLocationId(locationId),
			this.reviewService.getStats(locationId),
		]);
		return { reviews: reviewsList, stats };
	}

	@Get(':locationId/stats')
	async getStats(@Param('locationId') locationId: string) {
		const stats = await this.reviewService.getStats(locationId);
		return { stats };
	}

	@Post(':locationId')
	@UseGuards(JwtAuthGuard)
	async create(
		@CurrentUser() user: CurrentUserData,
		@Param('locationId') locationId: string,
		@Body() dto: CreateReviewDto
	) {
		const review = await this.reviewService.create(
			user.userId,
			locationId,
			dto.rating,
			dto.comment
		);
		return { review };
	}

	@Delete(':locationId')
	@UseGuards(JwtAuthGuard)
	async remove(@CurrentUser() user: CurrentUserData, @Param('locationId') locationId: string) {
		await this.reviewService.delete(user.userId, locationId);
		return { success: true };
	}
}
