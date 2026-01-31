import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ClockModule } from '../clock/clock.module';
import { TranscriptionModule } from '@manacore/bot-services';

@Module({
	imports: [ClockModule, TranscriptionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
