import { Module } from '@nestjs/common';
import { WorldClockController, TimezoneController } from './world-clock.controller';
import { WorldClockService } from './world-clock.service';

@Module({
	controllers: [WorldClockController, TimezoneController],
	providers: [WorldClockService],
	exports: [WorldClockService],
})
export class WorldClockModule {}
