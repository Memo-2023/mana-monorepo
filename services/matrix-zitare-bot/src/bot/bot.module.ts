import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { QuotesModule } from '../quotes/quotes.module';
import { SessionModule, TranscriptionModule, CreditModule } from '@manacore/bot-services';

@Module({
	imports: [QuotesModule, SessionModule.forRoot(), TranscriptionModule.forRoot(), CreditModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
