import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PlantaModule } from '../planta/planta.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [PlantaModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
