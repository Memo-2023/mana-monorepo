import { Module } from '@nestjs/common';
import { PlantaService } from './planta.service';

@Module({
	providers: [PlantaService],
	exports: [PlantaService],
})
export class PlantaModule {}
