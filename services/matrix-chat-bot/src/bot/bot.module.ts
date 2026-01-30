import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ChatModule } from '../chat/chat.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [ChatModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
