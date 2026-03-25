import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationLookupService } from './location-lookup.service';
import { ReviewModule } from '../review/review.module';

@Module({
	imports: [ReviewModule],
	controllers: [LocationController],
	providers: [LocationService, LocationLookupService],
	exports: [LocationService],
})
export class LocationModule {}
