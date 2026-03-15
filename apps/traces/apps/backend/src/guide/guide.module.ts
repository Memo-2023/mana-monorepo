import { Module } from '@nestjs/common';
import { GuideController } from './guide.controller';
import { GuideService } from './guide.service';
import { CityModule } from '../city/city.module';
import { PoiModule } from '../poi/poi.module';

@Module({
	imports: [CityModule, PoiModule],
	controllers: [GuideController],
	providers: [GuideService],
	exports: [GuideService],
})
export class GuideModule {}
