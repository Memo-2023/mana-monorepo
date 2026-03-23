import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationLookupService } from './location-lookup.service';

@Module({
	controllers: [LocationController],
	providers: [LocationService, LocationLookupService],
	exports: [LocationService],
})
export class LocationModule {}
