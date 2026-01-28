import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { NutriPhiModule } from '../nutriphi/nutriphi.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [NutriPhiModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
