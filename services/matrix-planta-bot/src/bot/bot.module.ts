import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PlantaModule } from '../planta/planta.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [PlantaModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
