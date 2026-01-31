import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PresiModule } from '../presi/presi.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [PresiModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
