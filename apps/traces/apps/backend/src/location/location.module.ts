import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { CityModule } from '../city/city.module';

@Module({
	imports: [CityModule],
	controllers: [LocationController],
	providers: [LocationService],
	exports: [LocationService],
})
export class LocationModule {}
