import { Module } from '@nestjs/common';
import { WateringController } from './watering.controller';
import { WateringService } from './watering.service';

@Module({
	controllers: [WateringController],
	providers: [WateringService],
	exports: [WateringService],
})
export class WateringModule {}
