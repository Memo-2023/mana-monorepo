import { Module } from '@nestjs/common';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
	imports: [GeminiModule],
	controllers: [MealsController],
	providers: [MealsService],
})
export class MealsModule {}
