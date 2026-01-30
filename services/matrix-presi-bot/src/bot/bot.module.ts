import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PresiModule } from '../presi/presi.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [PresiModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
