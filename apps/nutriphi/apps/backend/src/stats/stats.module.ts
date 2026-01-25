import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { MealModule } from '../meal/meal.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
	imports: [MealModule, GoalsModule],
	controllers: [StatsController],
	providers: [StatsService],
})
export class StatsModule {}
