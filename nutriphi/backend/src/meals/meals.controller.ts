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
} from '@nestjs/common';
import { MealsService } from './meals.service';
import {
  AnalyzeMealImageDto,
  AnalyzeMealTextDto,
  CreateMealDto,
  UpdateMealDto,
  UploadMealDto,
} from './dto/analyze-meal.dto';

@Controller('meals')
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
  async createMeal(@Body() dto: CreateMealDto) {
    return this.mealsService.createMeal(dto);
  }

  @Post('upload')
  async uploadMeal(@Body() dto: UploadMealDto) {
    return this.mealsService.uploadAndAnalyzeMeal(dto);
  }

  @Get('user/:userId')
  async getMealsByUser(
    @Param('userId') userId: string,
    @Query('date') date?: string,
  ) {
    return this.mealsService.getMealsByUser(userId, date);
  }

  @Get('user/:userId/summary')
  async getDailySummary(
    @Param('userId') userId: string,
    @Query('date') date: string,
  ) {
    return this.mealsService.getDailySummary(userId, date);
  }

  @Get(':id')
  async getMealById(@Param('id') id: string) {
    return this.mealsService.getMealById(id);
  }

  @Put(':id')
  async updateMeal(@Param('id') id: string, @Body() dto: UpdateMealDto) {
    return this.mealsService.updateMeal(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMeal(@Param('id') id: string) {
    return this.mealsService.deleteMeal(id);
  }
}
