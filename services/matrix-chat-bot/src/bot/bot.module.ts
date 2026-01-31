import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ChatModule } from '../chat/chat.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [ChatModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
