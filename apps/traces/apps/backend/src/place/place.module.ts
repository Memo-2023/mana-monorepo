import { Module } from '@nestjs/common';
import { PlaceController } from './place.controller';
import { PlaceService } from './place.service';
import { CityModule } from '../city/city.module';

@Module({
	imports: [CityModule],
	controllers: [PlaceController],
	providers: [PlaceService],
	exports: [PlaceService],
})
export class PlaceModule {}
