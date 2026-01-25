import {
	Controller,
	Get,
	Post,
	Delete,
	Patch,
	Body,
	Param,
	Query,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { MealService } from './meal.service';
import { IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';

class CreateMealDto {
	@IsDateString()
	date!: string;

	@IsEnum(['breakfast', 'lunch', 'dinner', 'snack'])
	mealType!: 'breakfast' | 'lunch' | 'dinner' | 'snack';

	@IsEnum(['photo', 'text'])
	inputType!: 'photo' | 'text';

	@IsString()
	description!: string;

	@IsOptional()
	@IsString()
	portionSize?: string;

	@IsNumber()
	confidence!: number;

	// Nutrition data
	@IsNumber()
	calories!: number;

	@IsNumber()
	protein!: number;

	@IsNumber()
	carbohydrates!: number;

	@IsNumber()
	fat!: number;

	@IsOptional()
	@IsNumber()
	fiber?: number;

	@IsOptional()
	@IsNumber()
	sugar?: number;
}

class QueryMealsDto {
	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	endDate?: string;
}

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealController {
	constructor(private readonly mealService: MealService) {}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateMealDto) {
		const { date, mealType, inputType, description, portionSize, confidence, ...nutrition } = dto;

		return this.mealService.create(
			user.userId,
			{
				date: new Date(date),
				mealType,
				inputType,
				description,
				portionSize,
				confidence,
				userId: user.userId,
			},
			nutrition
		);
	}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: QueryMealsDto) {
		if (query.date) {
			return this.mealService.findByDate(user.userId, new Date(query.date));
		}

		const startDate = query.startDate ? new Date(query.startDate) : new Date();
		const endDate = query.endDate ? new Date(query.endDate) : new Date();

		if (!query.startDate) {
			startDate.setDate(startDate.getDate() - 7);
		}

		return this.mealService.findByDateRange(user.userId, startDate, endDate);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.mealService.findOne(user.userId, id);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.mealService.delete(user.userId, id);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: Partial<CreateMealDto>
	) {
		const { date, mealType, inputType, description, portionSize, confidence, ...nutrition } = dto;

		return this.mealService.update(
			user.userId,
			id,
			{
				...(date && { date: new Date(date) }),
				...(mealType && { mealType }),
				...(inputType && { inputType }),
				...(description && { description }),
				...(portionSize && { portionSize }),
				...(confidence !== undefined && { confidence }),
			},
			Object.keys(nutrition).length > 0 ? nutrition : undefined
		);
	}
}
