import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { AnalysisModule } from '../analysis/analysis.module';
import { MealsModule } from '../meals/meals.module';
import { GoalsModule } from '../goals/goals.module';
import { StatsModule } from '../stats/stats.module';

@Module({
	imports: [AnalysisModule, MealsModule, GoalsModule, StatsModule],
	providers: [BotUpdate],
})
export class BotModule {}
