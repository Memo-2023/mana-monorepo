import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	HttpCode,
	HttpStatus,
	UseGuards,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import {
	AnalyzeMealImageDto,
	AnalyzeMealTextDto,
	CreateMealDto,
	UpdateMealDto,
	UploadMealDto,
} from './dto/analyze-meal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
	constructor(private readonly mealsService: MealsService) {}

	@Post('analyze/image')
	@HttpCode(HttpStatus.OK)
	async analyzeImage(@Body() dto: AnalyzeMealImageDto) {
		return this.mealsService.analyzeImage(dto.imageBase64);
	}

	@Post('analyze/text')
	@HttpCode(HttpStatus.OK)
	async analyzeText(@Body() dto: AnalyzeMealTextDto) {
		return this.mealsService.analyzeText(dto.description);
	}

	@Post()
	async createMeal(@Body() dto: CreateMealDto, @CurrentUser() user: CurrentUserData) {
		return this.mealsService.createMeal(dto, user.userId);
	}

	@Post('upload')
	async uploadMeal(@Body() dto: UploadMealDto, @CurrentUser() user: CurrentUserData) {
		return this.mealsService.uploadAndAnalyzeMeal(dto, user.userId);
	}

	@Get()
	async getMeals(@CurrentUser() user: CurrentUserData, @Query('date') date?: string) {
		return this.mealsService.getMealsByUser(user.userId, date);
	}

	@Get('summary')
	async getDailySummary(@CurrentUser() user: CurrentUserData, @Query('date') date: string) {
		return this.mealsService.getDailySummary(user.userId, date);
	}

	@Get(':id')
	async getMealById(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.mealsService.getMealById(id, user.userId);
	}

	@Put(':id')
	async updateMeal(
		@Param('id') id: string,
		@Body() dto: UpdateMealDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.mealsService.updateMeal(id, dto, user.userId);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteMeal(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.mealsService.deleteMeal(id, user.userId);
	}
}
